// Código actualizado para TallerDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const TallerDashboard = () => {
  const [solicitudesPorDiagnosticar, setSolicitudesPorDiagnosticar] = useState([]);
  const [solicitudesEnReparacion, setSolicitudesEnReparacion] = useState([]);
  // ... (el resto de los estados existentes)

  const cargarSolicitudes = async () => {
    try {
      // Asumimos que la ruta GET / ahora devuelve todas las solicitudes relevantes para el taller
      // En un sistema más complejo, se crearían rutas específicas
      const resDiag = await api.get('/solicitudes'); // 'Solicitud Creada'
      const resRep = await api.get('/solicitudes/en-reparacion'); // Nueva ruta backend necesaria
      setSolicitudesPorDiagnosticar(resDiag.data);
      setSolicitudesEnReparacion(resRep.data);
    } catch (error) {
      // ... manejo de error
    }
  };

  const handleFinalizarReparacion = async (id) => {
    const hora_salida = new Date().toISOString();
    try {
        await api.put(`/solicitudes/finalizar/${id}`, { hora_salida });
        // Recargar listas
    } catch (error) {
        // ... manejo de error
    }
  };

  // ... (resto de la lógica y JSX actualizado para mostrar ambas listas y el nuevo botón)
  return (
    <div>
      <h3>Panel del Taller</h3>
      {/* JSX para lista de diagnóstico */}
      <hr />
      <h4>En Reparación</h4>
      {solicitudesEnReparacion.map(solicitud => (
        <div key={solicitud.id}>
          <p>ID: {solicitud.id} - Necesidad: {solicitud.necesidad_reportada}</p>
          <button onClick={() => handleFinalizarReparacion(solicitud.id)}>Marcar como Finalizada</button>
        </div>
      ))}
    </div>
  );
};

export default TallerDashboard;