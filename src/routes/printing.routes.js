import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

import { supabase } from '../config/supabase.js'
import {
  verifyToken,
  verifyRole
} from '../middleware/auth.js'

const router = express.Router()

const AGENT_SECRET_ROUNDS = 12
const HEARTBEAT_OFFLINE_SECONDS = 90

const sanitizeText = (value, fallback = '') =>
  String(value ?? fallback).trim()

const getAgentCredentials = (req) => ({
  agentId:
    req.headers['x-agent-id'] ||
    req.body?.agent_id ||
    req.query?.agent_id,

  agentSecret:
    req.headers['x-agent-secret'] ||
    req.body?.agent_secret ||
    req.query?.agent_secret
})

const createAgentSecret = () =>
  crypto.randomBytes(48).toString('hex')

const createIdempotencyKey = ({
  purpose,
  referenceType,
  referenceId,
  suffix = ''
}) => {
  if (!referenceId) return null

  return [
    purpose,
    referenceType || 'unknown',
    referenceId,
    suffix
  ]
    .filter(Boolean)
    .join(':')
}

const logJobEvent = async ({
  jobId,
  agentId = null,
  eventType,
  message = '',
  details = {}
}) => {
  const { error } = await supabase
    .from('print_job_logs')
    .insert({
      job_id: jobId,
      agent_id: agentId,
      event_type: eventType,
      message,
      details
    })

  if (error) {
    console.error(
      'Error guardando log de impresión:',
      error.message
    )
  }
}

const agentAuth = async (req, res, next) => {
  try {
    const {
      agentId,
      agentSecret
    } = getAgentCredentials(req)

    if (!agentId || !agentSecret) {
      return res.status(401).json({
        success: false,
        message:
          'Credenciales del agente de impresión requeridas'
      })
    }

    const { data: agent, error } = await supabase
      .from('print_agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle()

    if (error) throw error

    if (!agent) {
      return res.status(401).json({
        success: false,
        message: 'Agente de impresión no encontrado'
      })
    }

    if (!agent.active || agent.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'Agente de impresión deshabilitado'
      })
    }

    const validSecret = await bcrypt.compare(
      String(agentSecret),
      agent.secret_hash
    )

    if (!validSecret) {
      return res.status(401).json({
        success: false,
        message:
          'Credenciales del agente de impresión inválidas'
      })
    }

    req.printAgent = agent

    return next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Error verificando agente de impresión'
    })
  }
}

const getAssignment = async (purpose) => {
  const { data, error } = await supabase
    .from('printer_assignments')
    .select(`
      *,
      agent:print_agents (
        id,
        name,
        machine_name,
        status,
        active,
        last_seen_at
      ),
      printer:print_agent_printers (
        id,
        system_name,
        display_name,
        status,
        active
      )
    `)
    .eq('purpose', purpose)
    .eq('active', true)
    .maybeSingle()

  if (error) throw error

  return data
}

const normalizePurpose = (purpose) => {
  const allowed = [
    'cash',
    'kitchen',
    'delivery',
    'customer_receipt',
    'cash_closing',
    'test'
  ]

  return allowed.includes(purpose)
    ? purpose
    : null
}

/**
 * ============================================================
 * REGISTRAR COMPUTADOR
 * Solo administrador.
 *
 * Devuelve el secreto una sola vez.
 * ============================================================
 */

router.post(
  '/agents/register',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const {
        name,
        machine_name,
        os_name = '',
        os_version = '',
        app_version = '',
        metadata = {}
      } = req.body

      if (!sanitizeText(name)) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del agente es obligatorio'
        })
      }

      if (!sanitizeText(machine_name)) {
        return res.status(400).json({
          success: false,
          message:
            'El nombre del computador es obligatorio'
        })
      }

      const agentSecret = createAgentSecret()

      const secretHash = await bcrypt.hash(
        agentSecret,
        AGENT_SECRET_ROUNDS
      )

      const machineName = sanitizeText(
        machine_name
      ).toUpperCase()

      const { data: existingAgent, error: findError } =
        await supabase
          .from('print_agents')
          .select('id')
          .eq('machine_name', machineName)
          .maybeSingle()

      if (findError) throw findError

      let agent

      if (existingAgent) {
        const { data, error } = await supabase
          .from('print_agents')
          .update({
            name: sanitizeText(name),
            os_name: sanitizeText(os_name),
            os_version: sanitizeText(os_version),
            app_version: sanitizeText(app_version),
            secret_hash: secretHash,
            metadata,
            status: 'offline',
            active: true
          })
          .eq('id', existingAgent.id)
          .select(`
            id,
            name,
            machine_name,
            os_name,
            os_version,
            app_version,
            status,
            active,
            created_at,
            updated_at
          `)
          .single()

        if (error) throw error

        agent = data
      } else {
        const { data, error } = await supabase
          .from('print_agents')
          .insert({
            name: sanitizeText(name),
            machine_name: machineName,
            os_name: sanitizeText(os_name),
            os_version: sanitizeText(os_version),
            app_version: sanitizeText(app_version),
            secret_hash: secretHash,
            metadata,
            status: 'offline',
            active: true
          })
          .select(`
            id,
            name,
            machine_name,
            os_name,
            os_version,
            app_version,
            status,
            active,
            created_at,
            updated_at
          `)
          .single()

        if (error) throw error

        agent = data
      }

      return res.status(201).json({
        success: true,
        message:
          'Agente registrado correctamente. Guarda el secreto porque no volverá a mostrarse.',
        agent,
        credentials: {
          agent_id: agent.id,
          agent_secret: agentSecret
        }
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error registrando agente de impresión'
      })
    }
  }
)

/**
 * ============================================================
 * LISTAR AGENTES
 * ============================================================
 */

router.get(
  '/agents',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const offlineLimit = new Date(
        Date.now() -
          HEARTBEAT_OFFLINE_SECONDS * 1000
      ).toISOString()

      await supabase
        .from('print_agents')
        .update({
          status: 'offline'
        })
        .eq('status', 'online')
        .lt('last_seen_at', offlineLimit)

      const { data, error } = await supabase
        .from('print_agents')
        .select(`
          id,
          name,
          machine_name,
          os_name,
          os_version,
          app_version,
          status,
          active,
          ip_address,
          metadata,
          last_seen_at,
          created_at,
          updated_at,
          printers:print_agent_printers (
            id,
            system_name,
            display_name,
            driver_name,
            port_name,
            is_default,
            active,
            status,
            capabilities,
            last_seen_at
          )
        `)
        .order('name', {
          ascending: true
        })

      if (error) throw error

      return res.json({
        success: true,
        agents: data || []
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error obteniendo agentes de impresión'
      })
    }
  }
)

/**
 * ============================================================
 * ACTIVAR / DESACTIVAR AGENTE
 * ============================================================
 */

router.patch(
  '/agents/:id/status',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params
      const { active } = req.body

      if (typeof active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message:
            'El campo active debe ser verdadero o falso'
        })
      }

      const { data, error } = await supabase
        .from('print_agents')
        .update({
          active,
          status: active
            ? 'offline'
            : 'disabled'
        })
        .eq('id', id)
        .select(`
          id,
          name,
          machine_name,
          status,
          active,
          last_seen_at
        `)
        .single()

      if (error) throw error

      return res.json({
        success: true,
        message: active
          ? 'Agente activado'
          : 'Agente desactivado',
        agent: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error actualizando agente'
      })
    }
  }
)

/**
 * ============================================================
 * HEARTBEAT DEL AGENTE
 * ============================================================
 */

router.post(
  '/agents/heartbeat',
  agentAuth,
  async (req, res) => {
    try {
      const agent = req.printAgent

      const {
        app_version,
        os_name,
        os_version,
        metadata
      } = req.body

      const forwardedIp =
        req.headers['x-forwarded-for']

      const ipAddress = Array.isArray(
        forwardedIp
      )
        ? forwardedIp[0]
        : String(
            forwardedIp ||
              req.socket.remoteAddress ||
              ''
          )
            .split(',')[0]
            .trim()

      const updateData = {
        status: 'online',
        last_seen_at: new Date().toISOString(),
        ip_address: ipAddress
      }

      if (app_version !== undefined) {
        updateData.app_version =
          sanitizeText(app_version)
      }

      if (os_name !== undefined) {
        updateData.os_name =
          sanitizeText(os_name)
      }

      if (os_version !== undefined) {
        updateData.os_version =
          sanitizeText(os_version)
      }

      if (metadata !== undefined) {
        updateData.metadata = metadata
      }

      const { data, error } = await supabase
        .from('print_agents')
        .update(updateData)
        .eq('id', agent.id)
        .select(`
          id,
          name,
          machine_name,
          status,
          active,
          app_version,
          last_seen_at
        `)
        .single()

      if (error) throw error

      await supabase.rpc(
        'requeue_stale_print_jobs',
        {
          p_minutes: 5
        }
      )

      return res.json({
        success: true,
        agent: data,
        server_time:
          new Date().toISOString()
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error actualizando heartbeat'
      })
    }
  }
)

/**
 * ============================================================
 * SINCRONIZAR IMPRESORAS DETECTADAS EN WINDOWS
 * ============================================================
 */

router.post(
  '/printers/sync',
  agentAuth,
  async (req, res) => {
    try {
      const agent = req.printAgent
      const { printers = [] } = req.body

      if (!Array.isArray(printers)) {
        return res.status(400).json({
          success: false,
          message:
            'Printers debe ser un arreglo'
        })
      }

      const now = new Date().toISOString()

      const validPrinters = printers
        .filter(
          (printer) =>
            sanitizeText(
              printer.system_name ||
                printer.name
            )
        )
        .map((printer) => ({
          agent_id: agent.id,

          system_name: sanitizeText(
            printer.system_name ||
              printer.name
          ),

          display_name: sanitizeText(
            printer.display_name ||
              printer.displayName ||
              printer.system_name ||
              printer.name
          ),

          driver_name: sanitizeText(
            printer.driver_name ||
              printer.driverName
          ),

          port_name: sanitizeText(
            printer.port_name ||
              printer.portName
          ),

          is_default: Boolean(
            printer.is_default ??
              printer.isDefault
          ),

          active: true,

          status: sanitizeText(
            printer.status,
            'available'
          ),

          capabilities:
            printer.capabilities &&
            typeof printer.capabilities === 'object'
              ? printer.capabilities
              : {},

          last_seen_at: now,
          updated_at: now
        }))

      if (validPrinters.length > 0) {
        const { error: upsertError } =
          await supabase
            .from('print_agent_printers')
            .upsert(validPrinters, {
              onConflict:
                'agent_id,system_name'
            })

        if (upsertError) throw upsertError
      }

      const activeNames = validPrinters.map(
        (printer) =>
          printer.system_name
      )

      const { data: currentPrinters, error: currentError } =
        await supabase
          .from('print_agent_printers')
          .select('id, system_name')
          .eq('agent_id', agent.id)

      if (currentError) throw currentError

      const missingPrinterIds = (
        currentPrinters || []
      )
        .filter(
          (printer) =>
            !activeNames.includes(
              printer.system_name
            )
        )
        .map((printer) => printer.id)

      if (missingPrinterIds.length > 0) {
        const { error: disableError } =
          await supabase
            .from('print_agent_printers')
            .update({
              active: false,
              status: 'offline',
              updated_at: now
            })
            .in('id', missingPrinterIds)

        if (disableError) throw disableError
      }

      const { data: syncedPrinters, error } =
        await supabase
          .from('print_agent_printers')
          .select('*')
          .eq('agent_id', agent.id)
          .order('is_default', {
            ascending: false
          })
          .order('display_name', {
            ascending: true
          })

      if (error) throw error

      return res.json({
        success: true,
        message:
          'Impresoras sincronizadas correctamente',
        printers: syncedPrinters || []
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error sincronizando impresoras'
      })
    }
  }
)

/**
 * ============================================================
 * LISTAR IMPRESORAS
 * ============================================================
 */

router.get(
  '/printers',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('print_agent_printers')
        .select(`
          *,
          agent:print_agents (
            id,
            name,
            machine_name,
            status,
            active,
            last_seen_at
          )
        `)
        .order('display_name', {
          ascending: true
        })

      if (error) throw error

      return res.json({
        success: true,
        printers: data || []
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error obteniendo impresoras'
      })
    }
  }
)

/**
 * ============================================================
 * LISTAR ASIGNACIONES
 * ============================================================
 */

router.get(
  '/assignments',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('printer_assignments')
        .select(`
          *,
          agent:print_agents (
            id,
            name,
            machine_name,
            status,
            active,
            last_seen_at
          ),
          printer:print_agent_printers (
            id,
            system_name,
            display_name,
            driver_name,
            port_name,
            is_default,
            status,
            active
          )
        `)
        .order('purpose', {
          ascending: true
        })

      if (error) throw error

      return res.json({
        success: true,
        assignments: data || []
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error obteniendo asignaciones'
      })
    }
  }
)

/**
 * ============================================================
 * GUARDAR ASIGNACIÓN
 * ============================================================
 */

router.post(
  '/assignments',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const {
        purpose,
        agent_id,
        printer_id,
        paper_width = 80,
        copies = 1,
        auto_print = true,
        active = true,
        settings = {}
      } = req.body

      const normalizedPurpose =
        normalizePurpose(purpose)

      if (!normalizedPurpose) {
        return res.status(400).json({
          success: false,
          message:
            'Propósito de impresión inválido'
        })
      }

      if (!agent_id || !printer_id) {
        return res.status(400).json({
          success: false,
          message:
            'Debes seleccionar un agente y una impresora'
        })
      }

      const { data: printer, error: printerError } =
        await supabase
          .from('print_agent_printers')
          .select(`
            id,
            agent_id,
            active,
            status
          `)
          .eq('id', printer_id)
          .maybeSingle()

      if (printerError) throw printerError

      if (!printer) {
        return res.status(404).json({
          success: false,
          message: 'Impresora no encontrada'
        })
      }

      if (printer.agent_id !== agent_id) {
        return res.status(400).json({
          success: false,
          message:
            'La impresora no pertenece al agente seleccionado'
        })
      }

      const assignmentData = {
        purpose: normalizedPurpose,
        agent_id,
        printer_id,
        paper_width: Number(
          paper_width
        ),
        copies: Number(copies),
        auto_print: Boolean(
          auto_print
        ),
        active: Boolean(active),
        settings
      }

      const { data, error } = await supabase
        .from('printer_assignments')
        .upsert(assignmentData, {
          onConflict: 'purpose'
        })
        .select(`
          *,
          agent:print_agents (
            id,
            name,
            machine_name,
            status
          ),
          printer:print_agent_printers (
            id,
            system_name,
            display_name,
            status
          )
        `)
        .single()

      if (error) throw error

      return res.json({
        success: true,
        message:
          'Asignación guardada correctamente',
        assignment: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error guardando asignación'
      })
    }
  }
)

/**
 * ============================================================
 * CREAR TRABAJO DE IMPRESIÓN
 * ============================================================
 */

router.post(
  '/jobs',
  verifyToken,
  async (req, res) => {
    try {
      const {
        purpose,
        reference_type = null,
        reference_id = null,
        title = '',
        payload = {},
        priority = 0,
        max_attempts = 3,
        idempotency_key = null
      } = req.body

      const normalizedPurpose =
        normalizePurpose(purpose)

      if (!normalizedPurpose) {
        return res.status(400).json({
          success: false,
          message:
            'Propósito de impresión inválido'
        })
      }

      const assignment =
        await getAssignment(
          normalizedPurpose
        )

      if (!assignment) {
        return res.status(409).json({
          success: false,
          message:
            `No existe una impresora asignada para "${normalizedPurpose}"`
        })
      }

      if (
        !assignment.agent?.active ||
        !assignment.printer?.active
      ) {
        return res.status(409).json({
          success: false,
          message:
            'El agente o la impresora asignada está desactivada'
        })
      }

      const finalIdempotencyKey =
        idempotency_key ||
        createIdempotencyKey({
          purpose:
            normalizedPurpose,
          referenceType:
            reference_type,
          referenceId:
            reference_id
        })

      if (finalIdempotencyKey) {
        const {
          data: existingJob,
          error: existingError
        } = await supabase
          .from('print_jobs')
          .select('*')
          .eq(
            'idempotency_key',
            finalIdempotencyKey
          )
          .maybeSingle()

        if (existingError) {
          throw existingError
        }

        if (existingJob) {
          return res.json({
            success: true,
            duplicated: true,
            message:
              'El trabajo de impresión ya existía',
            job: existingJob
          })
        }
      }

      const userId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.sub ||
        null

      const { data: job, error } = await supabase
        .from('print_jobs')
        .insert({
          purpose:
            normalizedPurpose,

          agent_id:
            assignment.agent_id,

          printer_id:
            assignment.printer_id,

          reference_type,
          reference_id,

          title:
            sanitizeText(title),

          payload: {
            ...payload,

            print_settings: {
              paper_width:
                assignment.paper_width,

              copies:
                assignment.copies,

              ...assignment.settings
            }
          },

          status: 'pending',

          priority:
            Number(priority),

          max_attempts:
            Math.max(
              1,
              Math.min(
                Number(max_attempts) ||
                  3,
                10
              )
            ),

          idempotency_key:
            finalIdempotencyKey,

          created_by:
            userId
        })
        .select()
        .single()

      if (error) throw error

      await logJobEvent({
        jobId: job.id,
        agentId:
          assignment.agent_id,
        eventType: 'created',
        message:
          'Trabajo de impresión creado',
        details: {
          purpose:
            normalizedPurpose,
          printer_id:
            assignment.printer_id
        }
      })

      return res.status(201).json({
        success: true,
        message:
          'Trabajo enviado a la cola de impresión',
        job
      })
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message:
            'Ya existe un trabajo con la misma clave de idempotencia'
        })
      }

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error creando trabajo de impresión'
      })
    }
  }
)

/**
 * ============================================================
 * CREAR PRUEBA DE IMPRESIÓN
 * ============================================================
 */

router.post(
  '/test',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const {
        purpose = 'test',
        agent_id,
        printer_id,
        paper_width = 80
      } = req.body

      if (!agent_id || !printer_id) {
        return res.status(400).json({
          success: false,
          message:
            'Debes seleccionar un agente y una impresora'
        })
      }

      const { data: printer, error: printerError } =
        await supabase
          .from('print_agent_printers')
          .select(`
            id,
            agent_id,
            display_name,
            system_name,
            active
          `)
          .eq('id', printer_id)
          .maybeSingle()

      if (printerError) throw printerError

      if (!printer) {
        return res.status(404).json({
          success: false,
          message: 'Impresora no encontrada'
        })
      }

      if (
        printer.agent_id !==
        agent_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            'La impresora no pertenece al agente seleccionado'
        })
      }

      const { data: job, error } =
        await supabase
          .from('print_jobs')
          .insert({
            purpose:
              normalizePurpose(purpose) ||
              'test',

            agent_id,
            printer_id,

            title:
              'Prueba de impresión',

            payload: {
              template:
                'test_ticket',

              business_name:
                'AMERICAN BURGER',

              date:
                new Date().toLocaleString(
                  'es-CL'
                ),

              printer_name:
                printer.display_name,

              print_settings: {
                paper_width:
                  Number(
                    paper_width
                  ),
                copies: 1
              }
            },

            status: 'pending',
            priority: 100,
            max_attempts: 3
          })
          .select()
          .single()

      if (error) throw error

      await logJobEvent({
        jobId: job.id,
        agentId: agent_id,
        eventType: 'test_created',
        message:
          'Prueba de impresión creada'
      })

      return res.status(201).json({
        success: true,
        message:
          'Prueba enviada a la cola',
        job
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error creando prueba de impresión'
      })
    }
  }
)

/**
 * ============================================================
 * AGENTE TOMA EL SIGUIENTE TRABAJO
 * ============================================================
 */

router.post(
  '/jobs/claim',
  agentAuth,
  async (req, res) => {
    try {
      const agent =
        req.printAgent

      const { data, error } =
        await supabase.rpc(
          'claim_next_print_job',
          {
            p_agent_id:
              agent.id
          }
        )

      if (error) throw error

      const job =
        Array.isArray(data)
          ? data[0] || null
          : data || null

      if (!job) {
        return res.json({
          success: true,
          job: null,
          message:
            'No hay trabajos pendientes'
        })
      }

      const { data: printer, error: printerError } =
        await supabase
          .from(
            'print_agent_printers'
          )
          .select(`
            id,
            system_name,
            display_name,
            driver_name,
            port_name,
            capabilities
          `)
          .eq(
            'id',
            job.printer_id
          )
          .single()

      if (printerError) {
        await supabase
          .from('print_jobs')
          .update({
            status: 'failed',
            failed_at:
              new Date().toISOString(),
            error_message:
              'Impresora asignada no encontrada'
          })
          .eq('id', job.id)

        throw printerError
      }

      return res.json({
        success: true,
        job: {
          ...job,
          printer
        }
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error obteniendo trabajo de impresión'
      })
    }
  }
)

/**
 * ============================================================
 * MARCAR COMO COMPLETADO
 * ============================================================
 */

router.post(
  '/jobs/:id/completed',
  agentAuth,
  async (req, res) => {
    try {
      const { id } = req.params
      const agent =
        req.printAgent

      const {
        details = {}
      } = req.body

      const { data: job, error: findError } =
        await supabase
          .from('print_jobs')
          .select('*')
          .eq('id', id)
          .eq(
            'agent_id',
            agent.id
          )
          .maybeSingle()

      if (findError) throw findError

      if (!job) {
        return res.status(404).json({
          success: false,
          message:
            'Trabajo de impresión no encontrado'
        })
      }

      if (
        job.status ===
        'completed'
      ) {
        return res.json({
          success: true,
          duplicated: true,
          message:
            'El trabajo ya estaba completado',
          job
        })
      }

      const { data, error } =
        await supabase
          .from('print_jobs')
          .update({
            status: 'completed',
            completed_at:
              new Date().toISOString(),
            failed_at: null,
            error_message: null
          })
          .eq('id', id)
          .eq(
            'agent_id',
            agent.id
          )
          .select()
          .single()

      if (error) throw error

      await logJobEvent({
        jobId: id,
        agentId: agent.id,
        eventType: 'completed',
        message:
          'Impresión completada correctamente',
        details
      })

      return res.json({
        success: true,
        message:
          'Trabajo completado',
        job: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error completando trabajo'
      })
    }
  }
)

/**
 * ============================================================
 * MARCAR COMO FALLIDO
 * ============================================================
 */

router.post(
  '/jobs/:id/failed',
  agentAuth,
  async (req, res) => {
    try {
      const { id } = req.params
      const agent =
        req.printAgent

      const {
        error_message =
          'Error de impresión',

        retry = true,

        details = {}
      } = req.body

      const { data: job, error: findError } =
        await supabase
          .from('print_jobs')
          .select('*')
          .eq('id', id)
          .eq(
            'agent_id',
            agent.id
          )
          .maybeSingle()

      if (findError) throw findError

      if (!job) {
        return res.status(404).json({
          success: false,
          message:
            'Trabajo de impresión no encontrado'
        })
      }

      const shouldRetry =
        Boolean(retry) &&
        Number(job.attempts) <
          Number(job.max_attempts)

      const updateData = shouldRetry
        ? {
            status: 'pending',
            available_at:
              new Date(
                Date.now() + 5000
              ).toISOString(),
            error_message:
              sanitizeText(
                error_message
              ),
            claimed_at: null
          }
        : {
            status: 'failed',
            failed_at:
              new Date().toISOString(),
            error_message:
              sanitizeText(
                error_message
              )
          }

      const { data, error } =
        await supabase
          .from('print_jobs')
          .update(updateData)
          .eq('id', id)
          .eq(
            'agent_id',
            agent.id
          )
          .select()
          .single()

      if (error) throw error

      await logJobEvent({
        jobId: id,
        agentId: agent.id,
        eventType: shouldRetry
          ? 'retry_scheduled'
          : 'failed',
        message:
          sanitizeText(
            error_message
          ),
        details
      })

      return res.json({
        success: true,
        retry_scheduled:
          shouldRetry,
        message: shouldRetry
          ? 'Trabajo programado para reintento'
          : 'Trabajo marcado como fallido',
        job: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error marcando trabajo como fallido'
      })
    }
  }
)

/**
 * ============================================================
 * LISTAR TRABAJOS
 * ============================================================
 */

router.get(
  '/jobs',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const {
        status,
        purpose,
        agent_id,
        limit = 100
      } = req.query

      let query = supabase
        .from('print_jobs')
        .select(`
          *,
          agent:print_agents (
            id,
            name,
            machine_name,
            status
          ),
          printer:print_agent_printers (
            id,
            system_name,
            display_name
          )
        `)
        .order('created_at', {
          ascending: false
        })
        .limit(
          Math.min(
            Number(limit) || 100,
            500
          )
        )

      if (status) {
        query = query.eq(
          'status',
          status
        )
      }

      if (purpose) {
        query = query.eq(
          'purpose',
          purpose
        )
      }

      if (agent_id) {
        query = query.eq(
          'agent_id',
          agent_id
        )
      }

      const { data, error } =
        await query

      if (error) throw error

      return res.json({
        success: true,
        jobs: data || []
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error obteniendo trabajos de impresión'
      })
    }
  }
)

/**
 * ============================================================
 * REINTENTAR TRABAJO MANUALMENTE
 * ============================================================
 */

router.post(
  '/jobs/:id/retry',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params

      const { data, error } =
        await supabase
          .from('print_jobs')
          .update({
            status: 'pending',
            attempts: 0,
            available_at:
              new Date().toISOString(),
            claimed_at: null,
            completed_at: null,
            failed_at: null,
            error_message: null
          })
          .eq('id', id)
          .select()
          .single()

      if (error) throw error

      await logJobEvent({
        jobId: id,
        agentId:
          data.agent_id,
        eventType:
          'manual_retry',
        message:
          'Trabajo reenviado manualmente'
      })

      return res.json({
        success: true,
        message:
          'Trabajo reenviado a la cola',
        job: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error reintentando trabajo'
      })
    }
  }
)

/**
 * ============================================================
 * CANCELAR TRABAJO
 * ============================================================
 */

router.post(
  '/jobs/:id/cancel',
  verifyToken,
  verifyRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params

      const { data, error } =
        await supabase
          .from('print_jobs')
          .update({
            status: 'cancelled',
            error_message:
              'Cancelado por administrador'
          })
          .eq('id', id)
          .in('status', [
            'pending',
            'failed'
          ])
          .select()
          .single()

      if (error) throw error

      await logJobEvent({
        jobId: id,
        agentId:
          data.agent_id,
        eventType: 'cancelled',
        message:
          'Trabajo cancelado por administrador'
      })

      return res.json({
        success: true,
        message:
          'Trabajo cancelado',
        job: data
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Error cancelando trabajo'
      })
    }
  }
)

export default router
