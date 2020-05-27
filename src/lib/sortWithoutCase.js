function sortWithoutCase(order, field) {
  const less = order === 'asc' ? -1 : 1;

  return (g1, g2) => {
    const a = (field ? g1[field] : g1).toLowerCase();
    const b = (field ? g2[field] : g2).toLowerCase();

    return (a === b) ? 0 : (a < b) ? less : less * -1;
  }
}

module.exports = sortWithoutCase;