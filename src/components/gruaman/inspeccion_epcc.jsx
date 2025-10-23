import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const preguntas = [
	{
		categoria: "ARNÉS",
		items: [
			"¿Cuenta con: Etiquetas, Cintas, Correas, Costuras, Partes Metálicas, Partes Plásticas en buen estado?",
		],
	},
	{
		categoria: "ARRESTADOR DE CAÍDAS",
		items: [
			"¿Presenta: Desgaste Excesivo, Picaduras, Grietas, Seguros y Partes Móviles, Corrosión en partes metálicas, Deformaciones (Dobladuras), Presencia de Moho, Resortes (Detectar fallas), Freno (hacer prueba)?",
		],
	},
	{
		categoria: "MOSQUETÓN",
		items: [
			"¿Presenta: Desgaste Excesivo, Picaduras, Grietas, Seguros y Partes Móviles, Corrosión en partes metálicas, Deformaciones (Dobladuras, etc), Bloqueo (ajuste excesivo) de los mosquetones en cierres de seguridad, Grietas o picaduras, Deterioro General, Ajuste seguro?",
		],
	},
	{
		categoria: "ESLINGA DE POSICIONAMIENTO",
		items: [
			"¿Cuenta con: Cintas, Correas, Cuerdas y Partes Metálicas en buen estado?",
		],
	},
	{
		categoria: "ESLINGA EN 'Y' CON ABSORBEDOR",
		items: [
			"¿Cuenta con: Etiquetas, Absorbedor de Caída, Cintas, Correas, Costuras, Partes Metálicas, Partes Plásticas en buen estado?",
		],
	},
	{
		categoria: "LÍNEA DE VIDA",
		items: [
			"¿Cuenta Con: Etiquetas, Partes Metálicas, Partes Plásticas, Cintas, Cuerdas en buen estado?",
		],
	},
];

function InspeccionEPCC({ value = {}, onChange }) {
	const [respuestas, setRespuestas] = useState(value);
	const [generales, setGenerales] = useState({
		nombre_cliente: "",
		nombre_proyecto: "",
		fecha_servicio: "",
		nombre_operador: "",
		cargo: "",
	});

	const navigate = useNavigate();

	useEffect(() => {
		const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
		const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
		const fechaHoy = new Date().toISOString().slice(0, 10);
		const cargo = localStorage.getItem("cargo_trabajador") || "";

		axios.get("http://localhost:3000/obras")
			.then(res => {
				let obras = [];
				if (Array.isArray(res.data.obras)) {
					obras = res.data.obras;
				}
				const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_proyecto);
				const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
				setGenerales({
					nombre_cliente: constructora,
					nombre_proyecto: nombre_proyecto,
					nombre_operador: nombre_operador,
					fecha_servicio: fechaHoy,
					cargo: cargo,
				});
			})
			.catch(() => {
				setGenerales({
					nombre_cliente: "",
					nombre_proyecto: nombre_proyecto,
					nombre_operador: nombre_operador,
					fecha_servicio: fechaHoy,
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

	const mapRespuestasToPayload = () => {
		return {
			// Datos generales
			nombre_cliente: generales.nombre_cliente,
			nombre_proyecto: generales.nombre_proyecto,
			fecha_servicio: generales.fecha_servicio,
			nombre_operador: generales.nombre_operador,
			cargo: generales.cargo,

			// Seriales y lotes
			serial_arnes: respuestas.serial_arnes || "",
			serial_arrestador: respuestas.serial_arrestador || "",
			serial_mosqueton: respuestas.serial_mosqueton || "",
			serial_posicionamiento: respuestas.serial_posicionamiento || "",
			serial_eslinga_y: respuestas.serial_eslinga_y || "",
			serial_linea_vida: respuestas.serial_linea_vida || "",

			// Resultados de inspección
			arnes: respuestas[0] || "",
			arrestador_caidas: respuestas[1] || "",
			mosqueton: respuestas[2] || "",
			eslinga_posicionamiento: respuestas[3] || "",
			eslinga_y_absorbedor: respuestas[4] || "",
			linea_vida: respuestas[5] || "",

			// Observaciones
			observaciones: respuestas.observaciones || "",
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const payload = mapRespuestasToPayload();

		// Validación de campos obligatorios
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

		const totalPreguntas = 6;
		for (let i = 0; i < totalPreguntas; i++) {
			if (!respuestas[i] || !["SI", "NO", "NA"].includes(respuestas[i])) {
				alert("Por favor responde todas las preguntas de la lista de chequeo.");
				return;
			}
		}

		try {
			await axios.post("http://localhost:3000/gruaman/inspeccion_epcc", payload);
			alert("Lista de inspección enviada correctamente.");
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
			{/* Datos Generales */}
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Datos Generales
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
					{[
						{ name: "nombre_cliente", label: "Cliente / Constructora" },
						{ name: "nombre_proyecto", label: "Proyecto / Constructora" },
						{ name: "fecha_servicio", label: "Fecha", type: "date" },
						{ name: "nombre_operador", label: "Trabajador autorizado" },
						{ name: "cargo", label: "Cargo" },
					].map((item) => (
						<div key={item.name} style={{ flex: 1, minWidth: 180 }}>
							<label className="label">{item.label}</label>
							<input
								type={item.type || "text"}
								name={item.name}
								value={generales[item.name]}
								readOnly={item.name !== "cargo"}
								onChange={handleGeneralesChange}
								className="permiso-trabajo-input"
							/>
						</div>
					))}
				</div>
			</div>

			{/* Seriales y lotes */}
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Equipos de Protección Contra Caídas - Serial y Lote
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
					{[
						{ name: "serial_arnes", label: "Serial y Lote Arnés" },
						{ name: "serial_arrestador", label: "Serial y Lote Arrestador de Caídas" },
						{ name: "serial_mosqueton", label: "Serial y Lote Mosquetón" },
						{ name: "serial_posicionamiento", label: "Serial y Lote Eslinga de Posicionamiento" },
						{ name: "serial_eslinga_y", label: 'Serial y Lote Eslinga en "Y" con Absorbedor' },
						{ name: "serial_linea_vida", label: "Serial y Lote Línea de Vida" },
					].map((item) => (
						<div key={item.name} style={{ flex: 1, minWidth: 180 }}>
							<label className="label">{item.label}</label>
							<input
								name={item.name}
								placeholder={item.label}
								value={respuestas[item.name] || ""}
								onChange={(e) => {
									const nuevas = { ...respuestas, [item.name]: e.target.value };
									setRespuestas(nuevas);
									if (onChange) onChange(nuevas);
								}}
								className="permiso-trabajo-input"
							/>
						</div>
					))}
				</div>
			</div>

			{/* Preguntas */}
			{preguntas.map((bloque, i) => (
				<div className="card-section" key={i}>
					<h4 className="card-title">{bloque.categoria}</h4>
					{bloque.items.map((pregunta, j) => {
						const idx = preguntaIdx++;
						return (
							<div key={idx} style={{ marginBottom: 8 }}>
								<div className="permiso-trabajo-label">{pregunta}</div>
								<select
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
			))}

			{/* Observaciones */}
			<div className="card-section">
				<label className="permiso-trabajo-label">OBSERVACIONES</label>
				<textarea
					className="permiso-trabajo-textarea"
					style={{ width: "100%", minHeight: 60 }}
					value={respuestas.observaciones || ""}
					onChange={(e) => {
						const nuevas = { ...respuestas, observaciones: e.target.value };
						setRespuestas(nuevas);
						if (onChange) onChange(nuevas);
					}}
				/>
			</div>

			{/* Firma */}
			<div className="card-section">
				<label className="permiso-trabajo-label">
					FIRMA TRABAJADOR AUTORIZADO / CONSTANCIA DE VERIFICACIÓN
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
					style={{ background: "#ff9800", color: "#fff" }}
				>
					Guardar
				</button>
			</div>
		</form>
	);
}

export default InspeccionEPCC;
