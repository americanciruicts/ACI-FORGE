// Equipment presets with maintenance cycles and warranty info
export interface EquipmentPreset {
  name: string
  category: string
  maintenance_cycle_days: number
  typical_warranty_years: number
  description: string
}

export const EQUIPMENT_CATEGORIES = [
  'Production Equipment',
  'Testing Equipment',
  'Safety Equipment',
  'HVAC Systems',
  'Electrical Systems',
  'Computer Systems',
  'Office Equipment',
  'Other'
]

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  // Production Equipment
  {
    name: 'PCB Assembly Machine',
    category: 'Production Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 2,
    description: 'Surface mount and through-hole PCB assembly'
  },
  {
    name: 'Reflow Oven',
    category: 'Production Equipment',
    maintenance_cycle_days: 60,
    typical_warranty_years: 3,
    description: 'Solder reflow processing'
  },
  {
    name: 'Wave Solder Machine',
    category: 'Production Equipment',
    maintenance_cycle_days: 30,
    typical_warranty_years: 2,
    description: 'Wave soldering system'
  },
  {
    name: 'Pick and Place Machine',
    category: 'Production Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 2,
    description: 'Component placement system'
  },
  {
    name: 'Conveyor System',
    category: 'Production Equipment',
    maintenance_cycle_days: 180,
    typical_warranty_years: 5,
    description: 'Production line conveyor'
  },

  // Testing Equipment
  {
    name: 'AOI Machine',
    category: 'Testing Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 2,
    description: 'Automated Optical Inspection'
  },
  {
    name: 'X-Ray Inspection System',
    category: 'Testing Equipment',
    maintenance_cycle_days: 180,
    typical_warranty_years: 3,
    description: 'X-ray inspection for BGA and hidden joints'
  },
  {
    name: 'ICT Tester',
    category: 'Testing Equipment',
    maintenance_cycle_days: 120,
    typical_warranty_years: 2,
    description: 'In-Circuit Testing equipment'
  },
  {
    name: 'Flying Probe Tester',
    category: 'Testing Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 2,
    description: 'Flying probe test system'
  },
  {
    name: 'Functional Test Station',
    category: 'Testing Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 2,
    description: 'Final functional testing'
  },

  // Safety Equipment
  {
    name: 'Fire Extinguisher',
    category: 'Safety Equipment',
    maintenance_cycle_days: 365,
    typical_warranty_years: 5,
    description: 'Fire safety equipment'
  },
  {
    name: 'Emergency Lighting',
    category: 'Safety Equipment',
    maintenance_cycle_days: 180,
    typical_warranty_years: 3,
    description: 'Emergency exit lighting'
  },
  {
    name: 'First Aid Station',
    category: 'Safety Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 0,
    description: 'First aid supplies and equipment'
  },
  {
    name: 'Eye Wash Station',
    category: 'Safety Equipment',
    maintenance_cycle_days: 30,
    typical_warranty_years: 5,
    description: 'Emergency eye wash station'
  },

  // HVAC Systems
  {
    name: 'Air Conditioning Unit',
    category: 'HVAC Systems',
    maintenance_cycle_days: 90,
    typical_warranty_years: 5,
    description: 'HVAC cooling system'
  },
  {
    name: 'Air Filtration System',
    category: 'HVAC Systems',
    maintenance_cycle_days: 30,
    typical_warranty_years: 3,
    description: 'Clean room air filtration'
  },
  {
    name: 'Exhaust System',
    category: 'HVAC Systems',
    maintenance_cycle_days: 90,
    typical_warranty_years: 5,
    description: 'Ventilation and exhaust'
  },

  // Electrical Systems
  {
    name: 'UPS System',
    category: 'Electrical Systems',
    maintenance_cycle_days: 180,
    typical_warranty_years: 3,
    description: 'Uninterruptible Power Supply'
  },
  {
    name: 'Generator',
    category: 'Electrical Systems',
    maintenance_cycle_days: 90,
    typical_warranty_years: 5,
    description: 'Backup power generator'
  },
  {
    name: 'Electrical Panel',
    category: 'Electrical Systems',
    maintenance_cycle_days: 365,
    typical_warranty_years: 10,
    description: 'Main electrical distribution'
  },

  // Computer Systems
  {
    name: 'Server',
    category: 'Computer Systems',
    maintenance_cycle_days: 90,
    typical_warranty_years: 3,
    description: 'Server hardware'
  },
  {
    name: 'Network Switch',
    category: 'Computer Systems',
    maintenance_cycle_days: 180,
    typical_warranty_years: 3,
    description: 'Network switching equipment'
  },
  {
    name: 'Workstation',
    category: 'Computer Systems',
    maintenance_cycle_days: 180,
    typical_warranty_years: 3,
    description: 'Desktop computer workstation'
  },

  // Office Equipment
  {
    name: 'Printer',
    category: 'Office Equipment',
    maintenance_cycle_days: 90,
    typical_warranty_years: 1,
    description: 'Office printer'
  },
  {
    name: 'Copier',
    category: 'Office Equipment',
    maintenance_cycle_days: 60,
    typical_warranty_years: 2,
    description: 'Office copier/scanner'
  },
  {
    name: 'Projector',
    category: 'Office Equipment',
    maintenance_cycle_days: 180,
    typical_warranty_years: 2,
    description: 'Presentation projector'
  }
]

export function getEquipmentPreset(equipmentName: string): EquipmentPreset | undefined {
  return EQUIPMENT_PRESETS.find(
    preset => preset.name.toLowerCase() === equipmentName.toLowerCase()
  )
}

export function getEquipmentsByCategory(category: string): EquipmentPreset[] {
  return EQUIPMENT_PRESETS.filter(preset => preset.category === category)
}

export function getAllEquipmentNames(): string[] {
  return EQUIPMENT_PRESETS.map(preset => preset.name)
}
