// Conversion factors are all "how many base units in 1 of this unit".
// Temperature is affine (not a pure ratio) so it's handled specially.
export const UNIT_CATEGORIES = {
  Length: { units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, 'μm': 1e-6, nm: 1e-9, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nmi: 1852 } },
  Mass: { units: { kg: 1, g: 0.001, mg: 1e-6, 'μg': 1e-9, tonne: 1000, lb: 0.45359237, oz: 0.0283495231, stone: 6.35029318, ton_us: 907.18474 } },
  Area: { units: { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, 'mm²': 1e-6, ha: 10000, acre: 4046.8564224, 'mi²': 2589988.110336, 'ft²': 0.09290304, 'in²': 0.00064516 } },
  Volume: { units: { L: 1, mL: 0.001, 'm³': 1000, 'cm³': 0.001, gal_us: 3.785411784, qt_us: 0.946352946, pt_us: 0.473176473, cup_us: 0.2365882365, floz_us: 0.0295735296, 'ft³': 28.3168466, 'in³': 0.0163870641 } },
  Speed: { units: { 'm/s': 1, 'km/h': 0.2777777778, mph: 0.44704, 'ft/s': 0.3048, knot: 0.5144444444 } },
  Time: { units: { s: 1, ms: 0.001, min: 60, h: 3600, day: 86400, week: 604800, year: 31557600 } },
  Temperature: { special: true, units: ['°C', '°F', 'K'] },
  Pressure: { units: { Pa: 1, kPa: 1000, MPa: 1e6, bar: 100000, atm: 101325, psi: 6894.757293, mmHg: 133.322387, torr: 133.3223684 } },
  Energy: { units: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, eV: 1.602176634e-19, BTU: 1055.05585 } },
  Power: { units: { W: 1, kW: 1000, MW: 1e6, hp: 745.699872, 'BTU/h': 0.29307107 } },
  Force: { units: { N: 1, kN: 1000, dyn: 1e-5, lbf: 4.4482216153, kgf: 9.80665 } },
  Torque: { units: { 'N·m': 1, 'kN·m': 1000, 'lb·ft': 1.3558179483, 'lb·in': 0.112984829 } },
  Angle: { units: { rad: 1, deg: 0.0174532925, grad: 0.0157079633, arcmin: 0.0002908882, arcsec: 0.0000048481, rev: 6.2831853072 } },
  'Data storage': { units: { bit: 0.125, B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 } },
  Frequency: { units: { Hz: 1, kHz: 1000, MHz: 1e6, GHz: 1e9 } },
  Density: { units: { 'kg/m³': 1, 'g/cm³': 1000, 'g/mL': 1000, 'lb/ft³': 16.01846337 } },
}

export function convert(category, value, fromUnit, toUnit) {
  const cat = UNIT_CATEGORIES[category]
  if (!cat) throw new Error('Unknown category: ' + category)

  if (cat.special) {
    let celsius
    if (fromUnit === '°C') celsius = value
    else if (fromUnit === '°F') celsius = ((value - 32) * 5) / 9
    else celsius = value - 273.15

    if (toUnit === '°C') return celsius
    if (toUnit === '°F') return (celsius * 9) / 5 + 32
    return celsius + 273.15
  }

  const factors = cat.units
  return (value * factors[fromUnit]) / factors[toUnit]
}

export const CATEGORY_NAMES = Object.keys(UNIT_CATEGORIES)
