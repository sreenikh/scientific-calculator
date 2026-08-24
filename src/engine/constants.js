export const CONSTANTS = {
  Math: [
    { sym: 'π', name: 'Pi', value: 3.14159265358979 },
    { sym: 'e', name: "Euler's number", value: 2.71828182845905 },
  ],
  Universal: [
    { sym: 'c', name: 'Speed of light in vacuum', value: 2.99792458e8 },
    { sym: 'G', name: 'Newtonian gravitational constant', value: 6.6743e-11 },
    { sym: 'h', name: 'Planck constant', value: 6.62607015e-34 },
    { sym: 'ħ', name: 'Reduced Planck constant', value: 1.054571817e-34 },
    { sym: 'μ0', name: 'Vacuum magnetic permeability', value: 1.25663706e-6 },
    { sym: 'ε0', name: 'Vacuum electric permittivity', value: 8.8541878128e-12 },
    { sym: 'Z0', name: 'Characteristic impedance of vacuum', value: 376.730313668 },
  ],
  Electromagnetic: [
    { sym: 'e⁻', name: 'Elementary charge', value: 1.602176634e-19 },
    { sym: 'Φ0', name: 'Magnetic flux quantum', value: 2.067833848e-15 },
    { sym: 'G0', name: 'Conductance quantum', value: 7.748091729e-5 },
    { sym: 'Kj', name: 'Josephson constant', value: 4.835978484e14 },
    { sym: 'μB', name: 'Bohr magneton', value: 9.2740100783e-24 },
    { sym: 'μN', name: 'Nuclear magneton', value: 5.0507837461e-27 },
  ],
  'Atomic & nuclear': [
    { sym: 'α', name: 'Fine-structure constant', value: 7.2973525693e-3 },
    { sym: 'R∞', name: 'Rydberg constant', value: 10973731.56816 },
    { sym: 'a0', name: 'Bohr radius', value: 5.29177210903e-11 },
    { sym: 'me', name: 'Electron mass', value: 9.1093837015e-31 },
    { sym: 'mp', name: 'Proton mass', value: 1.67262192369e-27 },
    { sym: 'mn', name: 'Neutron mass', value: 1.67492749804e-27 },
    { sym: 'u', name: 'Atomic mass unit', value: 1.6605390666e-27 },
  ],
  'Physico-chemical': [
    { sym: 'Na', name: 'Avogadro constant', value: 6.02214076e23 },
    { sym: 'R', name: 'Molar gas constant', value: 8.314462618 },
    { sym: 'k', name: 'Boltzmann constant', value: 1.380649e-23 },
    { sym: 'F', name: 'Faraday constant', value: 96485.33212 },
    { sym: 'σ', name: 'Stefan-Boltzmann constant', value: 5.670374419e-8 },
    { sym: 'Vm', name: 'Molar volume, ideal gas (STP)', value: 0.02241396954 },
  ],
}

export const CONSTANT_CATEGORY_NAMES = Object.keys(CONSTANTS)
