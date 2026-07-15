create or replace view public.inventory_cash_session_summary as
select
  cs.id as cash_session_id,
  cs.status,
  cs.opened_at,
  cs.closed_at,

  count(
    distinct im.item_id
  ) filter (
    where im.movement_source in (
      'sale',
      'sale_discount',
      'sale_edit_discount',
      'web_sale_discount',
      'sale_restore',
      'sale_edit_restore',
      'order_cancel_restore',
      'web_sale_restore'
    )
  ) as ingredients_count,

  count(
    distinct im.order_id
  ) filter (
    where im.movement_source in (
      'sale',
      'sale_discount',
      'sale_edit_discount',
      'web_sale_discount',
      'sale_restore',
      'sale_edit_restore',
      'order_cancel_restore',
      'web_sale_restore'
    )
  ) as orders_count,

  round(
    coalesce(
      sum(
        case
          when im.movement_source in (
            'sale',
            'sale_discount',
            'sale_edit_discount',
            'web_sale_discount'
          )
          then abs(coalesce(im.quantity, 0))

          when im.movement_source in (
            'sale_restore',
            'sale_edit_restore',
            'order_cancel_restore',
            'web_sale_restore'
          )
          then -abs(coalesce(im.quantity, 0))

          else 0
        end
      ),
      0
    )::numeric,
    4
  ) as total_quantity_used,

  round(
    coalesce(
      sum(
        case
          when im.movement_source in (
            'sale',
            'sale_discount',
            'sale_edit_discount',
            'web_sale_discount'
          )
          then abs(
            coalesce(
              im.total_cost,
              im.quantity * im.unit_cost,
              0
            )
          )

          when im.movement_source in (
            'sale_restore',
            'sale_edit_restore',
            'order_cancel_restore',
            'web_sale_restore'
          )
          then -abs(
            coalesce(
              im.total_cost,
              im.quantity * im.unit_cost,
              0
            )
          )

          else 0
        end
      ),
      0
    )::numeric,
    2
  ) as inventory_cost

from public.cash_sessions as cs

left join public.inventory_movements as im
  on im.cash_session_id = cs.id

group by
  cs.id,
  cs.status,
  cs.opened_at,
  cs.closed_at;

notify pgrst, 'reload schema';
