import express from 'express'
import { supabase } from '../config/supabase.js'
import { verifyToken, verifyRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (
          id,
          name
        ),
        recipe:product_recipes (
          id,
          product_id,
          inventory_item_id,
          quantity,
          unit,
          inventory:inventory_item_id (
            id,
            name,
            unit,
            stock,
            current_stock
          )
        )
      `)
      .order('name', { ascending: true })

    if (error) throw error

    return res.json({
      success: true,
      products: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener productos'
    })
  }
})

router.get('/:id/recipe', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('product_recipes')
      .select(`
        *,
        inventory:inventory_item_id (
          id,
          name,
          unit,
          stock,
          current_stock
        )
      `)
      .eq('product_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return res.json({
      success: true,
      recipe: data || []
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener receta'
    })
  }
})

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      description = '',
      category_id = null,
      price = 0,
      cost = 0,
      stock = 0,
      active = true,
      recipe = []
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del producto es obligatorio'
      })
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description,
        category_id,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        active
      })
      .select()
      .single()

    if (error) throw error

    if (Array.isArray(recipe) && recipe.length > 0) {
      const recipeRows = recipe
        .filter((item) => item.inventory_item_id && Number(item.quantity || 0) > 0)
        .map((item) => ({
          product_id: product.id,
          inventory_item_id: item.inventory_item_id,
          quantity: Number(item.quantity || 0),
          unit: item.unit || 'unid.'
        }))

      if (recipeRows.length > 0) {
        const { error: recipeError } = await supabase
          .from('product_recipes')
          .insert(recipeRows)

        if (recipeError) throw recipeError
      }
    }

    return res.status(201).json({
      success: true,
      product
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al crear producto'
    })
  }
})

router.put('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      description = '',
      category_id = null,
      price = 0,
      cost = 0,
      stock = 0,
      active = true,
      recipe
    } = req.body

    const { data: product, error } = await supabase
      .from('products')
      .update({
        name: name?.trim(),
        description,
        category_id,
        price: Number(price),
        cost: Number(cost),
        stock: Number(stock),
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (Array.isArray(recipe)) {
      const { error: deleteRecipeError } = await supabase
        .from('product_recipes')
        .delete()
        .eq('product_id', id)

      if (deleteRecipeError) throw deleteRecipeError

      const recipeRows = recipe
        .filter((item) => item.inventory_item_id && Number(item.quantity || 0) > 0)
        .map((item) => ({
          product_id: id,
          inventory_item_id: item.inventory_item_id,
          quantity: Number(item.quantity || 0),
          unit: item.unit || 'unid.'
        }))

      if (recipeRows.length > 0) {
        const { error: insertRecipeError } = await supabase
          .from('product_recipes')
          .insert(recipeRows)

        if (insertRecipeError) throw insertRecipeError
      }
    }

    return res.json({
      success: true,
      product
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar producto'
    })
  }
})

router.post('/:id/recipe', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { recipe = [] } = req.body

    if (!Array.isArray(recipe)) {
      return res.status(400).json({
        success: false,
        message: 'La receta debe ser un arreglo'
      })
    }

    const { error: deleteError } = await supabase
      .from('product_recipes')
      .delete()
      .eq('product_id', id)

    if (deleteError) throw deleteError

    const recipeRows = recipe
      .filter((item) => item.inventory_item_id && Number(item.quantity || 0) > 0)
      .map((item) => ({
        product_id: id,
        inventory_item_id: item.inventory_item_id,
        quantity: Number(item.quantity || 0),
        unit: item.unit || 'unid.'
      }))

    if (recipeRows.length > 0) {
      const { error: insertError } = await supabase
        .from('product_recipes')
        .insert(recipeRows)

      if (insertError) throw insertError
    }

    return res.json({
      success: true,
      message: 'Receta guardada correctamente'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al guardar receta'
    })
  }
})

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return res.json({
      success: true,
      message: 'Producto eliminado'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar producto'
    })
  }
})

export default router
