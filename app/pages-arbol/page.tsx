"use client";
import React from "react";

// Página raíz: solo muestra un mensaje y evita renderizar contenido duplicado
export default function PagesArbol() {
  return <div style={{padding: 40, textAlign: 'center', color: '#888'}}>
    <h2>Bienvenido al Árbol de la Ciencia</h2>
    <p>Selecciona un tema en la barra lateral para ver su contenido.</p>
  </div>;
}