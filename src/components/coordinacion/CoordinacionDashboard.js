import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import SignatureCanvas from 'react-signature-canvas';

const CoordinacionDashboard = () => {
  // 1. RECUPERAR DATOS DEL USUARIO
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { nombre_completo: 'Coordinador', sede_id: null };
  const nombreUsuario = user.nombre_completo || user.nombre || 'Coordinador';
  const nombreSede = user.sede_id === 1 ? 'Florencia' : user.sede_id === 2 ? 'Popayán' : 'General';

  // 2. ESTADOS
  const [porAprobar, setPorAprobar] = useState([]);
  const [porCerrar, setPorCerrar] = useState([]);
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const sigCanvases = {}; 

  // 3. CARGA DE DATOS
  const cargarDatos = async () => {
    try {
      setMensaje('Cargando...');
      const resAprobacion = await api.get('/solicitudes/coordinacion/aprobacion');
      const resCierre = await api.get('/solicitudes/coordinacion/cierre');
      const resHistorial = await api.get('/solicitudes/coordinacion/historial');
      
      setPorAprobar(resAprobacion.data);
      setPorCerrar(resCierre.data);
      setHistorialCompleto(resHistorial.data);
      setMensaje('');
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('Error al cargar los datos.');
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // 4. MANEJADORES
  const handleDecision = async (id, decision) => {
    if (sigCanvases[id].isEmpty()) {
      alert("La firma es obligatoria.");
      return;
    }
    
    let motivo_rechazo = null;
    if (decision === 'Rechazado') {
      motivo_rechazo = prompt('⚠️ Ingrese el motivo del rechazo (OBLIGATORIO):');
      if (!motivo_rechazo || motivo_rechazo.trim() === "") {
        alert("No se puede rechazar sin un motivo.");
        return;
      }
    }

    const firma_coordinacion_aprobacion = sigCanvases[id].toDataURL();
    
    try {
      await api.put(`/solicitudes/decision/${id}`, { 
          decision, 
          motivo_rechazo, 
          firma_coordinacion_aprobacion 
      });
      cargarDatos();
      alert("Decisión registrada correctamente.");
    } catch (error) { setMensaje('Error al procesar la decisión.'); }
  };

  const handleCierre = async (id) => {
    if (sigCanvases[id].isEmpty()) {
      alert("La firma es obligatoria.");
      return;
    }
    const firma_coordinacion_cierre = sigCanvases[id].toDataURL();
    try {
      await api.put(`/solicitudes/cierre/${id}`, { firma_coordinacion_cierre });
      cargarDatos();
      alert("Proceso cerrado y archivado.");
    } catch (error) { setMensaje('Error al cerrar el proceso.'); }
  };

  // --- 5. GENERADOR DE PDF PROFESIONAL (ESTILO COMPACTO UNA HOJA) ---
  const generarPDF = (solicitud) => {
    const doc = new jsPDF();
    const azulCorporativo = [44, 62, 80]; 
    const margen = 10;
    const anchoUtil = 190; 
    let y = 10; 

    // A. ENCABEZADO
    doc.setFillColor(...azulCorporativo);
    doc.rect(0, 0, 210, 30, 'F'); 
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('REPORTE DE MANTENIMIENTO VEHICULAR', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`ID: #${solicitud.id} | Fecha: ${new Date(solicitud.fecha_creacion).toLocaleDateString()}`, 105, 22, { align: 'center' });

    y = 35;

    // Helper para dibujar secciones compactas
    const dibujarSeccion = (titulo, contenido, altura = 20) => {
        if (y + altura > 270) { doc.addPage(); y = 20; }
        doc.setFillColor(230, 230, 230);
        doc.rect(margen, y, anchoUtil, 6, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(titulo.toUpperCase(), margen + 2, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lineas = doc.splitTextToSize(contenido || '---', anchoUtil - 4);
        doc.text(lineas, margen + 2, y + 10);
        
        const alturaReal = Math.max(altura, (lineas.length * 4) + 8);
        doc.setDrawColor(200, 200, 200);
        doc.rect(margen, y, anchoUtil, alturaReal);
        y += alturaReal + 2; 
    };

    // B. INFO VEHÍCULO
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`VEHÍCULO: ${solicitud.nombre_vehiculo} | PLACA: ${solicitud.placa_vehiculo} | SEDE: ${solicitud.nombre_sede || 'General'}`, margen, y);
    y += 6;

    // C. SECCIONES DE DATOS
    dibujarSeccion("1. Solicitud Inicial", `CONDUCTOR: ${solicitud.nombre_conductor}\nREPORTE: ${solicitud.necesidad_reportada}`, 15);

    if (solicitud.diagnostico_taller) {
        dibujarSeccion("2. Diagnóstico Técnico", `TÉCNICO: ${solicitud.nombre_tecnico || 'N/A'}\nFECHA: ${new Date(solicitud.hora_ingreso_taller).toLocaleString()}\nDIAGNÓSTICO: ${solicitud.diagnostico_taller}`, 20);
    }

    if (solicitud.fecha_aprobacion_rechazo) {
        const estado = solicitud.motivo_rechazo ? 'RECHAZADO' : 'APROBADO';
        let texto = `COORDINADOR: ${solicitud.nombre_coordinador || 'N/A'} | ESTADO: ${estado}`;
        if(solicitud.motivo_rechazo) texto += `\nMOTIVO: ${solicitud.motivo_rechazo}`;
        dibujarSeccion("3. Decisión Coordinación", texto, 15);
    }

    if (solicitud.trabajos_realizados) {
        dibujarSeccion("4. Reparación", `FECHA SALIDA: ${new Date(solicitud.hora_salida_taller).toLocaleString()}\nTRABAJOS: ${solicitud.trabajos_realizados}\nREPUESTOS: ${solicitud.repuestos_utilizados}`, 20);
    }

    if (solicitud.fecha_cierre_proceso) {
        dibujarSeccion("5. Cierre Final", `FECHA: ${new Date(solicitud.fecha_cierre_proceso).toLocaleString()}\nOBSERVACIÓN CONDUCTOR: ${solicitud.observaciones_entrega_conductor || 'Satisfacción.'}`, 15);
    }

    // D. FIRMAS (En fila horizontal)
    if (y + 35 > 280) doc.addPage();
    const yFirmas = y + 5;
    const wFirma = 40, hFirma = 25;
    let xFirma = margen + 5;

    const ponerFirma = (titulo, img) => {
        doc.setFontSize(7); doc.text(titulo, xFirma, yFirmas - 2);
        if (img) { try { doc.addImage(img, 'PNG', xFirma, yFirmas, wFirma, hFirma); doc.rect(xFirma, yFirmas, wFirma, hFirma); } catch(e){} } 
        else { doc.rect(xFirma, yFirmas, wFirma, hFirma); doc.text('Sin Firma', xFirma+5, yFirmas+10); }
        xFirma += wFirma + 5;
    };

    ponerFirma("Solicita (Conductor)", solicitud.firma_conductor_solicitud);
    ponerFirma("Diagnostica (Taller)", solicitud.firma_taller_diagnostico);
    ponerFirma("Aprueba (Coord)", solicitud.firma_coordinacion_aprobacion);
    ponerFirma("Recibe (Conductor)", solicitud.firma_conductor_satisfaccion);
    
    doc.save(`reporte_${solicitud.id}.pdf`);
  };

  return (
    <main className="container">
      <hgroup>
        <h3>Bienvenido, {nombreUsuario}</h3>
        <p>Panel de Coordinación | Sede: <strong>{nombreSede}</strong></p>
      </hgroup>
      {mensaje && <article><p>{mensaje}</p></article>}

      <details open>
        <summary>Solicitudes por Aprobar ({porAprobar.length})</summary>
        {porAprobar.map(s => (
          <article key={s.id}>
            <header><strong>ID #{s.id}</strong> | {s.nombre_vehiculo}</header>
            <p><strong>Reporte:</strong> {s.necesidad_reportada}</p>
            <p style={{background:'#f0f0f0', padding:'5px'}}><strong>Diagnóstico:</strong> {s.diagnostico_taller}</p>
            <div style={{border:'1px solid #ccc', width:300, height:150, background:'white'}}>
              <SignatureCanvas ref={ref => { sigCanvases[s.id] = ref; }} canvasProps={{width:300, height:150}} />
            </div>
            <div className="grid" style={{marginTop:'1rem'}}>
              <button onClick={() => handleDecision(s.id, 'Aprobado')}>Aprobar</button>
              <button onClick={() => handleDecision(s.id, 'Rechazado')} className="secondary">Rechazar</button>
            </div>
          </article>
        ))}
      </details>

      <details open>
        <summary>Pendientes de Cierre ({porCerrar.length})</summary>
        {porCerrar.map(s => (
          <article key={s.id}>
             <header><strong>ID #{s.id}</strong> | {s.nombre_vehiculo}</header>
             <p><strong>Estado:</strong> {s.estado}</p>
             <p><strong>Observación Conductor:</strong> {s.observaciones_entrega_conductor || "Ninguna"}</p>
             <div style={{border:'1px solid #ccc', width:300, height:150, background:'white'}}>
               <SignatureCanvas ref={ref => { sigCanvases[s.id] = ref; }} canvasProps={{width:300, height:150}} />
             </div>
             <button onClick={() => handleCierre(s.id)} style={{marginTop:'1rem'}}>Firmar y Archivar</button>
          </article>
        ))}
      </details>

      {/* --- TRAZABILIDAD VISUAL MEJORADA --- */}
      <details>
        <summary>Historial Completo ({historialCompleto.length})</summary>
        {historialCompleto.map(s => (
          <article key={s.id}>
            <header>
              <strong>ID #{s.id}</strong> | {s.nombre_vehiculo} | <mark>{s.estado}</mark>
            </header>
            
            <div style={{paddingLeft:'1rem', borderLeft:'3px solid var(--pico-primary)', fontSize:'0.9rem'}}>
                <p><strong>1️⃣ Solicitud:</strong> {s.necesidad_reportada} ({new Date(s.fecha_creacion).toLocaleString()})</p>
                
                {s.diagnostico_taller && (
                    <>
                        <hr style={{margin:'0.5rem 0'}}/>
                        <p><strong>2️⃣ Diagnóstico:</strong> {s.diagnostico_taller}</p>
                    </>
                )}

                {s.fecha_aprobacion_rechazo && (
                    <>
                        <hr style={{margin:'0.5rem 0'}}/>
                        <p><strong>3️⃣ Decisión:</strong> {s.motivo_rechazo ? <span style={{color:'red'}}>Rechazado</span> : 'Aprobado'}</p>
                        {s.motivo_rechazo && <p style={{color:'red'}}>Motivo: {s.motivo_rechazo}</p>}
                    </>
                )}

                {s.trabajos_realizados && (
                    <>
                        <hr style={{margin:'0.5rem 0'}}/>
                        <p><strong>4️⃣ Reparación:</strong> {s.trabajos_realizados}</p>
                    </>
                )}

                {s.fecha_cierre_proceso && (
                    <>
                        <hr style={{margin:'0.5rem 0'}}/>
                        <p><strong>5️⃣ Cierre:</strong> {s.observaciones_entrega_conductor || 'Entregado a satisfacción'}</p>
                    </>
                )}
            </div>

            {s.estado === 'Proceso Finalizado' && (
                <footer style={{marginTop:'1rem'}}><button onClick={() => generarPDF(s)}>📄 Descargar PDF Oficial</button></footer>
            )}
          </article>
        ))}
      </details>
    </main>
  );
};

export default CoordinacionDashboard;