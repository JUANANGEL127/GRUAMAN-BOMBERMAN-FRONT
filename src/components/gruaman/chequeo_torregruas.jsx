import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const preguntas = [
	{
		categoria: "CONDICIONES DE SEGURIDAD",
		items: [
			"Cuenta con el Equipo de Protección Personal (guantes, casco con barbuquejo, tapaoídos, gafas con filtro UV calzado de seguridad etc.).",
			"Cuenta con el Equipo de Protección Contra Caídas (Arnés de cuerpo completo, arrestador de caídas, mosquetones, eslinga en “Y” con absorbedor, eslinga de posicionamiento, línea de vida (vertical y horizontal), mecanismos de anclaje).",
			"Cuenta con la ropa de dotación ya sea overol, camisa o jean.",
		],
	},
	{
		categoria: "CONTROLES OPERACIONALES PARA LA TORRE GRÚA",
		items: [
			"¿Se ha verificado que toda la tornillería y pasadores de las uniones, estén bien ajustados?",
			"¿Se ha verificado que anillo arriostrador este bien sujeto a la Torre Grúa?",
			"¿Se ha verificado que las soldaduras de el marco y las vigas estén en buen estado?",
			"¿La base de la torre grua se encuentra en buenas condiciones, sin grietas o deformaciones?",
			"¿Se verificó el buen funcionamiento del pito?",
			"¿Se ha verificado el buen estado de los cables de alimentación eléctrica del equipo?",
			"¿Se probó en vacio y con velocidad lenta los movimientos de la máquina, giro, elevación y carro?",
			"¿Se ha verificado el buen estado y el enrollamiento de los cables?",
			"¿Los frenos se encuentran funcionando bien?",
			"¿Se ha verificado el buen estado y funcionamiento de las poleas y el soporte de la polea dinamométrica?",
			"¿Se ha verificado el buen estado del gancho y el seguro?",
			"¿Se ha verificado el buen funcionamiento del punto muerto?",
			"¿El mando se encuentra en buen estado?",
		],
	},
	{
		categoria: "ELEMENTOS Y EQUIPO DE IZAJE DE CARGAS/SEGURIDAD PARA EL APAREJADOR",
		items: [
			"Baldes de Concreto/Escombro/Tierra están en buen estado?",
			"Canasta para materiales está en buen estado?",
			"Se ha verificado que los estrobos (guaya, reata, eslinga, cadena) se encuentran en buen estado?",
			"Los accesorios de extremos (grilletes) se encuentran en buen estado?",
			"Cuenta con ayudante para amarre de cargas?",
			"Cuenta con radio de comunicación",
		],
	},
];

function ChequeoTorreGruas({ value = {}, onChange }) {
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

	const mapRespuestasToPayload = () => {
		return {
			nombre_cliente: generales.cliente,
			nombre_proyecto: generales.proyecto,
			fecha_servicio: generales.fecha,
			nombre_operador: generales.operador,
			cargo: generales.cargo,
			epp_personal: respuestas[0] || "",
			epp_contra_caidas: respuestas[1] || "",
			ropa_dotacion: respuestas[2] || "",
			tornilleria_ajustada: respuestas[3] || "",
			anillo_arriostrador: respuestas[4] || "",
			soldaduras_buen_estado: respuestas[5] || "",
			base_buenas_condiciones: respuestas[6] || "",
			funcionamiento_pito: respuestas[7] || "",
			cables_alimentacion: respuestas[8] || "",
			movimientos_maquina: respuestas[9] || "",
			cables_enrollamiento: respuestas[10] || "",
			frenos_funcionando: respuestas[11] || "",
			poleas_dinamometrica: respuestas[12] || "",
			gancho_seguro: respuestas[13] || "",
			punto_muerto: respuestas[14] || "",
			mando_buen_estado: respuestas[15] || "",
			baldes_buen_estado: respuestas[16] || "",
			canasta_materiales: respuestas[17] || "",
			estrobos_buen_estado: respuestas[18] || "",
			grilletes_buen_estado: respuestas[19] || "",
			ayudante_amarre: respuestas[20] || "",
			radio_comunicacion: respuestas[21] || "",
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
		const totalPreguntas = 22; // 0 a 21
		for (let i = 0; i < totalPreguntas; i++) {
			if (!respuestas[i] || !["SI", "NO", "NA"].includes(respuestas[i])) {
				alert("Por favor responde todas las preguntas de la lista de chequeo.");
				return;
			}
		}

		try {
			await axios.post("http://localhost:3000/gruaman/chequeo_torregruas", payload);
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

export default ChequeoTorreGruas;
