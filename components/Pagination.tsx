'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string; // Ahora es opcional ya que no usaremos redirecciones
  onPageChange: (page: number) => void; // Ahora es requerido para manejar cambios de página
}

export default function Pagination({ currentPage, totalPages, basePath, onPageChange }: PaginationProps) {
  // No mostrar paginación si solo hay una página
  if (totalPages <= 1) return null;

  // Manejar el cambio de página sin redirecciones
  const handlePageChange = (page: number) => {
    onPageChange(page);
    // Resetear la posición de scroll para que la barra de progreso funcione correctamente
    window.scrollTo(0, 0);
  };

  // Determinar qué páginas mostrar (siempre mostrar primera, última y algunas alrededor de la actual)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Ajustar según necesidad

    if (totalPages <= maxPagesToShow) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Siempre incluir la primera página
      pageNumbers.push(1);

      // Calcular el rango alrededor de la página actual
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Ajustar si estamos cerca del inicio o final
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Agregar elipsis si es necesario
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Agregar páginas del rango calculado
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Agregar elipsis si es necesario
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Siempre incluir la última página
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <nav className="pagination-container" aria-label="Navegación de páginas">
      <ul className="pagination">
        {/* Botón Anterior */}
        <li className={`pagination-item ${currentPage === 1 ? 'disabled' : ''}`}>
          {currentPage === 1 ? (
            <span className="pagination-link disabled">Anterior</span>
          ) : (
            <button 
              className="pagination-link"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Anterior
            </button>
          )}
        </li>

        {/* Números de página */}
        {getPageNumbers().map((page, index) => (
          <li 
            key={index} 
            className={`pagination-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
          >
            {page === '...' ? (
              <span className="pagination-ellipsis">...</span>
            ) : (
              <button
                className={`pagination-link ${page === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(Number(page))}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Botón Siguiente */}
        <li className={`pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          {currentPage === totalPages ? (
            <span className="pagination-link disabled">Siguiente</span>
          ) : (
            <button 
              className="pagination-link"
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Siguiente
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}