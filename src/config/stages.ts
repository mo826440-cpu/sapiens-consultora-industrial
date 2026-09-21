export type StageDefinition = {
  order: number
  slug: string
  name: string
  items: string[]
}

export const PROJECT_STAGES: readonly StageDefinition[] = [
  {
    order: 1,
    slug: 'identidad-y-enfoque',
    name: 'Identidad y enfoque',
    items: ['Nombre y marca', 'Socios, roles y propósito', 'Cliente ideal inicial'],
  },
  {
    order: 2,
    slug: 'propuesta-de-valor',
    name: 'Propuesta de valor',
    items: [
      'Problemas que resolvemos',
      'Resultado que obtiene el cliente',
      'Diferencial frente a software y consultoras',
    ],
  },
  {
    order: 3,
    slug: 'servicios-y-productos',
    name: 'Servicios y productos',
    items: ['Diagnóstico Industrial 360', 'Módulos de implementación', 'Seguimiento mensual'],
  },
  {
    order: 4,
    slug: 'modelo-comercial',
    name: 'Modelo comercial',
    items: ['Alcance y entregables', 'Precios y forma de cobro', 'Modelo 70 % estándar y 30 % adaptación'],
  },
  {
    order: 5,
    slug: 'demos-y-caso-modelo',
    name: 'Demos y caso modelo',
    items: [
      'Dashboard y aplicación demostrativa',
      'Ejemplo agroindustrial',
      'Comparación antes y después',
    ],
  },
  {
    order: 6,
    slug: 'pagina-web-institucional',
    name: 'Página web institucional',
    items: [
      'Presentar el proyecto y el equipo',
      'Explicar servicios y metodología',
      'Mostrar demos y recibir consultas',
    ],
  },
  {
    order: 7,
    slug: 'difusion-y-prospeccion',
    name: 'Difusión y prospección',
    items: ['Contenidos y redes', 'Red de contactos y empresas objetivo', 'Reuniones iniciales'],
  },
  {
    order: 8,
    slug: 'primer-cliente',
    name: 'Primer cliente',
    items: ['Propuesta y cierre', 'Implementación piloto', 'Resultados, testimonio y caso real'],
  },
] as const
