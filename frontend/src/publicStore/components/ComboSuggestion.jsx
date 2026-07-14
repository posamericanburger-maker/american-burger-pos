const openComboSuggestion = (burger) => {
  console.log(products)

  console.log('Hamburguesa:', burger)
  console.log('Papas:', suggestionProducts.fries)
  console.log('Bebida:', suggestionProducts.drink)

  if (
    !isBurgerProduct(burger) ||
    !suggestionProducts.fries ||
    !suggestionProducts.drink
  ) {
    return
  }

  setComboSuggestion({
    open: true,
    burger,
    fries: suggestionProducts.fries,
    drink: suggestionProducts.drink
  })
}
