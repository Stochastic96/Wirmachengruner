"""CO2 emission calculator for receipt categories."""

# CO2 emissions in kg per €100 spent by category
CO2_FACTORS = {
    "food": 2.5,
    "transport": 5.0,
    "office": 1.5,
    "shopping": 2.0,
    "accommodation": 3.5,
    "entertainment": 1.2,
    "utilities": 4.0,
    "healthcare": 1.0,
    "default": 2.0,
}


def calculate_co2(amount: float, category: str | None) -> float:
    """
    Calculate CO2 emissions for a receipt.

    Args:
        amount: Receipt amount in EUR
        category: Category string (optional)

    Returns:
        CO2 emissions in kg
    """
    if not amount or amount <= 0:
        return 0.0

    category_lower = (category or "default").lower().strip()
    factor = CO2_FACTORS.get(category_lower, CO2_FACTORS["default"])
    return round((amount / 100) * factor, 2)


def get_category_co2_factor(category: str | None) -> float:
    """Get CO2 factor for a category."""
    category_lower = (category or "default").lower().strip()
    return CO2_FACTORS.get(category_lower, CO2_FACTORS["default"])


def get_co2_tips(total_co2: float) -> str:
    """Get carbon footprint tips based on total CO2."""
    if total_co2 < 5:
        return "🌱 Excellent! Your carbon footprint is very low."
    elif total_co2 < 15:
        return "🌿 Good! Consider offsetting with tree planting or renewable energy."
    elif total_co2 < 30:
        return "🌍 You could reduce by using public transport or buying local food."
    else:
        return "⚠️ High carbon footprint. Consider sustainable shopping habits."
