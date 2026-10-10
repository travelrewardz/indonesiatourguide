import { get, all } from "./db";
import type { PriceRule, Tour, TourOption, TourPriceTier } from "./types";

/**
 * Server-side pricing. The client never decides what a booking costs:
 * every total is computed here from the database, the travel date and the
 * authenticated user's role, then persisted onto the booking record.
 */

export type PricingRole = "PUBLIC" | "AGENT" | "SUPPLIER";

export type PriceBreakdown = {
  currency: "USD";
  unitPrice: number;
  pax: number;
  grossTotal: number;
  discount: number;
  total: number; // amount charged
  agentNetTotal: number | null;
  commission: number | null;
  supplierAmount: number;
  priceLabel: string | null; // seasonal rule label or sale marker
};

export function getTourBySlug(slug: string): Tour | undefined {
  return get<Tour>("SELECT * FROM tours WHERE slug = ?", slug);
}

export function getTourById(id: string): Tour | undefined {
  return get<Tour>("SELECT * FROM tours WHERE id = ?", id);
}

export function getOptions(tourId: string): TourOption[] {
  return all<TourOption>("SELECT * FROM tour_options WHERE tour_id = ? ORDER BY sort_order, rowid", tourId);
}

/** All pax tiers for a tour (tour-level ladder + per-option ladders). */
export function tourTiers(tourId: string): TourPriceTier[] {
  return all<TourPriceTier>("SELECT * FROM tour_price_tiers WHERE tour_id = ? ORDER BY option_id, min_pax", tourId);
}

/** The single lowest tier price for a tour — drives the card "from" price. */
export function lowestTierPrice(tourId: string): number | null {
  const row = get<{ p: number | null }>("SELECT MIN(price) AS p FROM tour_price_tiers WHERE tour_id = ?", tourId);
  return row?.p ?? null;
}

function tierFor(tiers: TourPriceTier[], optionId: string, pax: number): TourPriceTier | undefined {
  return tiers.find(
    (t) => t.option_id === optionId && pax >= t.min_pax && (t.max_pax == null || pax <= t.max_pax),
  );
}

export function priceRuleFor(tourId: string, optionId: string | null, date: string): PriceRule | undefined {
  return get<PriceRule>(
    `SELECT * FROM price_rules
     WHERE tour_id = ? AND date_from <= ? AND date_to >= ? AND (option_id = '' OR option_id = ?)
     ORDER BY CASE WHEN option_id = '' THEN 1 ELSE 0 END LIMIT 1`,
    tourId, date, date, optionId ?? "",
  );
}

export function unitPriceFor(
  tour: Tour,
  option: TourOption | null,
  date: string,
  pax = 1,
): { price: number; label: string | null } {
  const rule = priceRuleFor(tour.id, option?.id ?? null, date);
  if (rule) return { price: rule.price, label: rule.label ?? "Seasonal pricing" };
  if (option) {
    const tier = tierFor(tourTiers(tour.id), option.id, pax);
    if (tier) return { price: tier.price, label: tier.label ?? "Group price" };
    return { price: option.price, label: null };
  }
  const tier = tierFor(tourTiers(tour.id), "", pax);
  if (tier) return { price: tier.price, label: tier.label ?? "Group price" };
  if (tour.sale_price && tour.sale_price > 0) return { price: tour.sale_price, label: "Special offer" };
  return { price: tour.base_price, label: null };
}

/**
 * Computes the authoritative booking total.
 * - PUBLIC: tier / sale price / option price / seasonal rule.
 * - AGENT: negotiated net rate — tour.agent_price, or the public unit price
 *   minus agent_discount_pct when the supplier offers one; when neither is
 *   set the supplier accepts no agent/member discount and the agent pays
 *   retail (earning their commission instead).
 */
export function computePrice(opts: {
  tour: Tour;
  option?: TourOption | null;
  date: string;
  pax: number;
  role: PricingRole;
  commissionPct?: number;
}): PriceBreakdown {
  const { tour, option, date, pax, role, commissionPct = 0 } = opts;
  const { price: publicUnit, label } = unitPriceFor(tour, option ?? null, date, pax);

  if (role === "AGENT") {
    const pct = tour.agent_discount_pct ?? null;
    const net = tour.agent_price ?? (pct != null && pct > 0 ? round(publicUnit * (1 - pct / 100)) : null);
    if (net != null) {
      const gross = publicUnit * pax;
      const agentNetTotal = round(net * pax);
      return {
        currency: "USD",
        unitPrice: net,
        pax,
        grossTotal: gross,
        discount: round(gross - agentNetTotal),
        total: agentNetTotal, // agent pays the net rate
        agentNetTotal,
        commission: round(gross - agentNetTotal),
        supplierAmount: round(tour.base_price * pax * (1 - (tourCommissionPct(tour) / 100))),
        priceLabel: tour.agent_price ? "Agent net rate" : `Agent price (${pct}% off)`,
      };
    }
  }

  const gross = publicUnit * pax;
  const commission = commissionPct > 0 ? round((gross * commissionPct) / 100) : 0;
  const listTotal = tour.base_price * pax;
  return {
    currency: "USD",
    unitPrice: publicUnit,
    pax,
    grossTotal: round(listTotal),
    discount: round(Math.max(0, listTotal - gross)),
    total: round(gross),
    agentNetTotal: null,
    commission: commission > 0 ? commission : null,
    supplierAmount: round(gross - commission),
    priceLabel: label,
  };
}

function tourCommissionPct(tour: Tour): number {
  if (!tour.supplier_id) return 15;
  const s = get<{ commission_pct: number }>("SELECT commission_pct FROM suppliers WHERE id = ?", tour.supplier_id);
  return s?.commission_pct ?? 15;
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}
