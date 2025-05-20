# Árbol de la Ciencia
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/LeinadOdreiuqzi/ArbolDeLaCiencia)

Una aplicación web para visualizar y explorar la estructura y relaciones del conocimiento científico como un árbol interactivo jerárquico.

## Tabla de Contenidos
- [Descripción](#descripción)
- [Instalación](#instalación)
- [Uso](#uso)
- [Características](#características)
- [Arquitectura Técnica](#arquitectura-técnica)
- [Estructura de Datos](#estructura-de-datos)
- [Componentes Principales](#componentes-principales)
- [Tecnologías](#tecnologías)
- [Licencia](#licencia)
- [Estado del Proyecto](#estado-del-proyecto)

## Descripción
Árbol de la Ciencia es una herramienta diseñada para ayudar a los usuarios a descubrir, navegar y comprender las conexiones entre conceptos científicos a través de una interfaz jerárquica interactiva. La aplicación organiza el conocimiento en una estructura de árbol con diferentes niveles: Áreas, Especialidades, Temas y Contenidos, permitiendo una exploración intuitiva del conocimiento científico.

## Instalación
1. Clona el repositorio:
   ```bash
   git clone <repository-url>
   cd ArbolDeLaCiencia
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso
Para ejecutar el servidor de desarrollo:
```bash
npm run dev
```
Luego abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Características

- **Navegación Jerárquica**: Explora el conocimiento científico organizado en niveles (Áreas, Especialidades, Temas, Contenidos)
- **Búsqueda Integrada**: Encuentra rápidamente temas específicos en toda la estructura
- **Sistema de Favoritos**: Guarda tus temas preferidos para acceso rápido
- **Visualización de Grafos**: Explora las relaciones entre conceptos mediante un grafo interactivo
- **Interfaz Adaptable**: Diseño responsivo que funciona en dispositivos móviles y de escritorio
- **Modo Oscuro/Claro**: Cambia entre temas visuales según tu preferencia

## Arquitectura Técnica

La aplicación está construida con Next.js, un framework de React que proporciona renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG). La arquitectura sigue un enfoque modular con los siguientes componentes principales:

- **Frontend**: Interfaz de usuario construida con React y Next.js
- **API**: Endpoints para obtener y manipular datos de la jerarquía de páginas
- **Servicios**: Lógica de negocio para transformar y procesar datos
- **Almacenamiento**: Persistencia de datos para la estructura jerárquica y preferencias de usuario

La aplicación utiliza el enrutamiento basado en archivos de Next.js para la navegación entre páginas y la API Routes para los endpoints del backend.

## Estructura de Datos

El sistema se basa en una estructura de árbol jerárquico donde cada nodo representa un concepto científico. Los nodos principales son:

```typescript
type TopicNode = {
  id: string;          // Identificador único del nodo
  label: string;       // Título visible del nodo
  slug: string;        // Identificador URL-friendly
  url: string;         // Ruta completa al nodo
  children?: TopicNode[]; // Nodos hijos (subniveles)
  metadata?: {
    level: number;     // Nivel jerárquico (1=Área, 2=Especialidad, etc.)
    type: string;      // Tipo de nodo (área, especialidad, tema, contenido)
  };
};
```

La jerarquía se organiza en cuatro niveles principales:
1. **Áreas**: Campos amplios del conocimiento (ej. Física, Biología)
2. **Especialidades**: Subdivisiones de áreas (ej. Mecánica Cuántica, Genética)
3. **Temas**: Conceptos específicos dentro de especialidades
4. **Contenidos**: Material detallado sobre temas específicos

## Licencia
MIT

## Estado del Proyecto
En desarrollo activo
