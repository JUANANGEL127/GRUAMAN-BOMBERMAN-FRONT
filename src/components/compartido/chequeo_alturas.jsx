import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const preguntas = [
	{
		categoria: "CONDICIONES DE SALUD",
		items: [
			"Presenta actualmente algún síntoma o malestar físico (mareo, dolor de cabeza, visión borrosa, dificultad respiratoria, etc)",
			"¿Está tomando algún medicamento que pueda afectar su estado de alerta, equilibrio, o capacidad para realizar tareas criticas?",
			"¿Ha consumido bebidas alcohólicas o sustancias psicoactivas en las últimas 12 horas?",
			"¿Se encuentra en condiciones físicas y mentales para realizar tareas que exigen altos niveles de concentración como trabajo en alturas espacios confinados, izaje, manejo de químicos, energías peligrosas o tomar decisiones en las que pueda poner en riesgo la vida propia o de otras personas?",
		],
	},
	{
		categoria: "CONDICIONES GENERALES DE SEGURIDAD",
		items: [
			"¿El lugar de trabajo, está demarcado/señalizado y en orden para la ejecución segura del trabajo?",
			"¿Se realiza inspección pre-uso de los medios de comunicación y están en buen estado?",
			"¿El equipo cuenta con demarcación y señalización y el ingreso es seguro al equipo?",
			"¿La base del equipo está libre de empozamiento de agua?",
			"¿El equipo cuenta con iluminación para trabajos nocturnos?",
			"¿Se ha informado y advertido el uso adecuado y correcto de los EPP/EPCC para el trabajo, ha sido entendido por los trabajadores?",
			"¿Los trabajadores utilizan EPP según el factor de riesgo al que están expuestos?",
			"¿Los EPCC del personal son adecuados al riesgo del trabajo?",
			"¿Existe interferencia con otro tipo de trabajos",
			"¿En el desarrollo del trabajo los trabajadores autorizados son observados de forma continua?",
		],
	},
	{
		categoria: "SISTEMA DE ACCESO Y PUNTO DE ANCLAJE",
		items: [
			"¿Se tiene definido y se garantiza el punto de anclaje y su buen estado?",
			"¿Se ha realizado una inspeccion previa al Sistema de Acceso para TA, se encuentra en buen estado y condiciones seguras?",
		],
	},
	{
		categoria: "IZAJE DE CARGAS",
		items: [
			"¿Se cuenta con un Plan de Izaje y se cumple el Programa de izaje de cargas?",
			"¿Se realiza inspeccion pre uso de los elementos de izaje (baldes, canastas, eslingas de cadena, bloque de carga...) garantizando su buen estado?",
			"¿Los elementos de izaje se les realiza limpieza despues de cada uso para garantizar su funcionamiento y la no caida de materiales adheridos?",
			"¿Se ha asignado un auxiliar de piso (aparejador de cargas) y se garantiza el acompañamiento permanente durante la tarea?",
		],
	},
	{
		categoria: "INTERVENCION DEL RIESGO ELECTRICO",
		items: [
			"¿Se cuenta con la consignación del circuito a intervenir?",
			"¿Los circuitos a trabajar han sido previamente identificados?",
			"Si el trabajo se realiza sin tensión, ¿está garantizada la aplicación de las cinco reglas de oro?",
			"Si el trabajo se realiza con tensión, ¿está garantizado el cumplimiento del protocolo de seguridad que corresponda de acuerdo al nivel de tensión?",
			"¿Se ha informado y advertido a los trabajadores los riesgos que puedan presentarse durante este trabajo y las medidas de intervención?",
			"¿Están garantizadas las distancias mínimas de seguridad frente a las partes con tensión?",
			"¿El(Los) tablero(s) eléctrico(s) está(n) libre(s) elementos puedan hacer arco eléctrico?",
			"¿Los cables del equipo se encuentran en buen estado?",
		],
	},
];

function ChequeoAlturas({ value = {}, onChange }) {
	const [respuestas, setRespuestas] = useState(value);
	const [generales, setGenerales] = useState({
		cliente: "",
		proyecto: "",
		fecha: "",
		operador: "",
		cargo: "",
	});
	const navigate = useNavigate();

	useEffect(() => {
		const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
		const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
		const fechaHoy = new Date().toISOString().slice(0, 10);
		const cargo = localStorage.getItem("cargo_trabajador") || "";

		// Obtener cliente/constructora como en permiso_trabajo.jsx
		axios.get("http://localhost:3000/obras")
			.then(res => {
				let obras = [];
				if (Array.isArray(res.data.obras)) {
					obras = res.data.obras;
				}
				const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_proyecto);
				const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
				setGenerales({
					cliente: constructora,
					proyecto: nombre_proyecto,
					operador: nombre_operador,
					fecha: fechaHoy,
					cargo: cargo,
				});
			})
			.catch(() => {
				setGenerales({
					cliente: "",
					proyecto: nombre_proyecto,
					operador: nombre_operador,
					fecha: fechaHoy,
					cargo: cargo,
				});
			});
	}, []);

	const handleRespuesta = (idx, val) => {
		const nuevas = { ...respuestas, [idx]: val };
		setRespuestas(nuevas);
		if (onChange) onChange(nuevas);
	};

	const handleGeneralesChange = (e) => {
		setGenerales({ ...generales, [e.target.name]: e.target.value });
	};

	let preguntaIdx = 0;

	// Mapeo de respuestas a campos de la tabla
	const mapRespuestasToPayload = () => {
		return {
			nombre_cliente: generales.cliente,
			nombre_proyecto: generales.proyecto,
			fecha_servicio: generales.fecha,
			nombre_operador: generales.operador,
			cargo: generales.cargo,

			// CATEGORÍA 1: CONDICIONES DE SALUD
			sintomas_fisicos: respuestas[0] || "",
			medicamento: respuestas[1] || "",
			consumo_sustancias: respuestas[2] || "",
			condiciones_fisicas_mentales: respuestas[3] || "",

			// CATEGORÍA 2: CONDICIONES GENERALES DE SEGURIDAD
			lugar_trabajo_demarcado: respuestas[4] || "",
			inspeccion_medios_comunicacion: respuestas[5] || "",
			equipo_demarcado_seguro: respuestas[6] || "",
			base_libre_empozamiento: respuestas[7] || "",
			iluminacion_trabajos_nocturnos: respuestas[8] || "",
			uso_adecuado_epp_epcc: respuestas[9] || "",
			uso_epp_trabajadores: respuestas[10] || "",
			epcc_adecuado_riesgo: respuestas[11] || "",
			interferencia_otros_trabajos: respuestas[12] || "",
			observacion_continua_trabajadores: respuestas[13] || "",

			// CATEGORÍA 3: SISTEMA DE ACCESO Y PUNTO DE ANCLAJE
			punto_anclaje_definido: respuestas[14] || "",
			inspeccion_previa_sistema_acceso: respuestas[15] || "",

			// CATEGORÍA 4: IZAJE DE CARGAS
			plan_izaje_cumple_programa: respuestas[16] || "",
			inspeccion_elementos_izaje: respuestas[17] || "",
			limpieza_elementos_izaje: respuestas[18] || "",
			auxiliar_piso_asignado: respuestas[19] || "",

			// CATEGORÍA 5: INTERVENCIÓN DEL RIESGO ELÉCTRICO
			consignacion_circuito: respuestas[20] || "",
			circuitos_identificados: respuestas[21] || "",
			cinco_reglas_oro: respuestas[22] || "",
			trabajo_con_tension_protocolo: respuestas[23] || "",
			informacion_riesgos_trabajadores: respuestas[24] || "",
			distancias_minimas_seguridad: respuestas[25] || "",
			tablero_libre_elementos_riesgo: respuestas[26] || "",
			cables_en_buen_estado: respuestas[27] || "",

			observaciones: respuestas.observaciones || "",
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const payload = mapRespuestasToPayload();

		// Validación de datos generales
		if (
			!payload.nombre_cliente ||
			!payload.nombre_proyecto ||
			!payload.fecha_servicio ||
			!payload.nombre_operador ||
			!payload.cargo
		) {
			alert("Por favor completa todos los datos generales.");
			return;
		}

		// Validación de todos los campos SI/NO/NA
		const totalPreguntas = 28; // 0 a 27
		for (let i = 0; i < totalPreguntas; i++) {
			if (!respuestas[i] || !["SI", "NO", "NA"].includes(respuestas[i])) {
				alert("Por favor responde todas las preguntas de la lista de chequeo.");
				return;
			}
		}

		try {
			await axios.post("http://localhost:3000/compartido/chequeo_alturas", payload);
			alert("Lista de chequeo enviada correctamente.");
			if (onChange) onChange({});
			setRespuestas({});
			navigate(-1);
		} catch (err) {
			alert("Error al enviar la lista de chequeo.");
			console.error(err);
		}
	};

	return (
		<form className="form-container" onSubmit={handleSubmit}>
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Datos Generales
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
					<div style={{ flex: 1, minWidth: 180 }}>
						<label className="label">Cliente / Constructora</label>
						<input
							name="cliente"
							placeholder="Cliente / Constructora"
							value={generales.cliente}
							readOnly
							className="permiso-trabajo-input"
						/>
					</div>
					<div style={{ flex: 1, minWidth: 180 }}>
						<label className="label">Proyecto / Constructora</label>
						<input
							name="proyecto"
							placeholder="Proyecto / Constructora"
							value={generales.proyecto}
							readOnly
							className="permiso-trabajo-input"
						/>
					</div>
					<div style={{ flex: 1, minWidth: 120 }}>
						<label className="label">Fecha</label>
						<input
							type="date"
							name="fecha"
							value={generales.fecha}
							readOnly
							className="permiso-trabajo-input"
						/>
					</div>
					<div style={{ flex: 1, minWidth: 180 }}>
						<label className="label">Trabajador autorizado</label>
						<input
							name="operador"
							placeholder="Trabajador autorizado"
							value={generales.operador}
							readOnly
							className="permiso-trabajo-input"
						/>
					</div>
					<div style={{ flex: 1, minWidth: 180 }}>
						<label className="label">Cargo</label>
						<input
							name="cargo"
							placeholder="Cargo"
							value={generales.cargo}
							onChange={handleGeneralesChange}
							className="permiso-trabajo-input"
						/>
					</div>
				</div>
			</div>
			{preguntas.map((bloque, i) => (
				<div
					className="card-section"
					key={i}
					style={{
						marginBottom: 0.5,
						paddingBottom: 0.5,
						borderBottom: i < preguntas.length - 1 ? "1px solid #e0e0e0" : "none",
					}}
				>
					<h4 className="card-title" style={{ marginBottom: 14 }}>
						{bloque.categoria}
					</h4>
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						{bloque.items.map((pregunta, j) => {
							const idx = preguntaIdx++;
							return (
								<div key={idx} style={{ marginBottom: 4 }}>
									<div
										className="permiso-trabajo-label"
										style={{ marginBottom: 4 }}
									>
										{pregunta}
									</div>
									<select
										name={`pregunta_${idx}`}
										value={respuestas[idx] || ""}
										onChange={(e) => handleRespuesta(idx, e.target.value)}
										className="permiso-trabajo-select"
										style={{ minWidth: 120, maxWidth: 220 }}
									>
										<option value="">--</option>
										<option value="SI">SI</option>
										<option value="NO">NO</option>
										<option value="NA">NA</option>
									</select>
								</div>
							);
						})}
					</div>
				</div>
			))}
			<div className="card-section">
				<label className="permiso-trabajo-label" htmlFor="observaciones">
					OBSERVACIONES
				</label>
				<div style={{ width: "100%", display: "flex" }}>
					<textarea
						id="observaciones"
						className="permiso-trabajo-textarea"
						style={{
							width: "100%",
							minHeight: 60,
							resize: "vertical",
							boxSizing: "border-box",
							marginLeft: 0,
							marginRight: 0,
						}}
						value={respuestas.observaciones || ""}
						onChange={(e) => {
							const nuevas = { ...respuestas, observaciones: e.target.value };
							setRespuestas(nuevas);
							if (onChange) onChange(nuevas);
						}}
					/>
				</div>
			</div>
			<div className="card-section">
				<label className="permiso-trabajo-label">
					FIRMA TRABAJADOR AUTORIZADO / CONSTANCIA DE VERIFICACION DIARIA DE LAS
					CONDICIONES SEGURAS PARA EL TA
				</label>
				<input
					type="text"
					className="permiso-trabajo-input"
					placeholder="Nombre y/o firma"
					value={respuestas.firma || ""}
					onChange={(e) => {
						const nuevas = { ...respuestas, firma: e.target.value };
						setRespuestas(nuevas);
						if (onChange) onChange(nuevas);
					}}
				/>
			</div>
			<div style={{ textAlign: "right", marginTop: 24 }}>
				<button
					type="submit"
					className="button"
					style={{
						background: "#ff9800",
						color: "#fff"
					}}
				>
					Guardar
				</button>
			</div>
		</form>
	);
}

export default ChequeoAlturas;
