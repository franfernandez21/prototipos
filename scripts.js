document.addEventListener('DOMContentLoaded', () => {

    /* --- MODAL TÁCTIL Y DESLIZABLE PARA TRABAJOS --- */
    const track = document.getElementById("carousel-track");
    const modal = document.getElementById("modal-trabajo");
    const modalAntesContainer = document.getElementById("modal-img-antes-container");
    const modalImgAntes = document.getElementById("modal-img-antes");
    const modalImgDespues = document.getElementById("modal-img-despues");
    const modalTitulo = document.getElementById("modal-titulo");
    const btnToggle = document.getElementById("btn-toggle-antes-despues");
    const btnCerrar = document.getElementById("cerrar-modal");
    const swipeContainer = document.getElementById("modal-swipe-container");

    // Función para alternar la vista entre Antes y Después
    const toggleAntesDespues = (mostrarAntes) => {
        if (!modalAntesContainer || !btnToggle) return;
        if (mostrarAntes) {
            modalAntesContainer.style.opacity = "1";
            btnToggle.textContent = "Ver Después";
        } else {
            modalAntesContainer.style.opacity = "0";
            btnToggle.textContent = "Ver Antes";
        }
    };

    // Abrir modal al hacer clic/tap en las tarjetas (originales o clones)
    document.addEventListener("click", (e) => {
        const card = e.target.closest(".gallery-card");
        if (card) {
            const antesSrc = card.dataset.antes;
            const despuesSrc = card.dataset.despues;
            const titulo = card.dataset.titulo;

            if (!antesSrc || !despuesSrc) return;

            modalImgAntes.src = antesSrc;
            modalImgDespues.src = despuesSrc;
            modalTitulo.textContent = titulo || "Trabajo a medida";

            toggleAntesDespues(true); // Arranca mostrando el "Antes"

            if (track) track.style.animationPlayState = "paused";
            if (modal) {
                modal.classList.remove("hidden");
                modal.classList.add("flex");
            }
        }
    });

    // Botón toggle manual
    if (btnToggle) {
        btnToggle.addEventListener("click", () => {
            const isShowingantes = modalAntesContainer.style.opacity !== "0";
            toggleAntesDespues(!isShowingantes);
        });
    }

    // SOPORTE DE SWIPE (DESLIZAR CON EL DEDO) EN EL MODAL
    if (swipeContainer && modalAntesContainer) {
        let touchstartX = 0;
        let touchendX = 0;

        swipeContainer.addEventListener("touchstart", (e) => {
            touchstartX = e.changedTouches[0].screenX;
        }, { passive: true });

        swipeContainer.addEventListener("touchend", (e) => {
            touchendX = e.changedTouches[0].screenX;
            const distance = touchstartX - touchendX;

            // Si desliza con fuerza mayor a 40px cambia de antes a después
            if (Math.abs(distance) > 40) {
                if (distance > 0) {
                    // Deslizó hacia la izquierda -> Ver Después
                    toggleAntesDespues(false);
                } else {
                    // Deslizó hacia la derecha -> Ver Antes
                    toggleAntesDespues(true);
                }
            }
        }, { passive: true });
    }

    // Cerrar Modal
    const cerrarModal = () => {
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }
        if (track) track.style.animationPlayState = "running";
    };

    if (btnCerrar) btnCerrar.addEventListener("click", cerrarModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) cerrarModal();
        });
    }

    /* --- 2. ACORDEÓN FAQ UNIFICADO --- */
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq-btn');
        if (!btn) return;

        const content = btn.nextElementSibling;
        const icon = btn.querySelector('svg');
        const isOpen = content.classList.contains('open') || (content.style.maxHeight && content.style.maxHeight !== '0px');

        document.querySelectorAll('.faq-content').forEach(el => {
            el.classList.remove('open');
            el.style.maxHeight = '0px';
            el.style.opacity = '0';
        });
        document.querySelectorAll('.faq-btn svg').forEach(el => el.classList.remove('rotate-180'));

        if (!isOpen) {
            content.classList.add('open');
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            icon.classList.add('rotate-180');
        }
    });

    /* --- 3. CARGA DE DATOS DESDE EL CMS (JSON) --- */
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el && text !== undefined) el.innerText = text;
    };

    const setElementImage = (id, src) => {
        const el = document.getElementById(id);
        if (el && src) el.src = src;
    };

    const fetchJson = async (url) => {
        try {
            const res = await fetch(`${url}?t=${Date.now()}`);
            if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
            return await res.json();
        } catch (error) {
            console.error("Error cargando JSON:", error);
            return null;
        }
    };

    // Contacto
    fetchJson('/content/contacto.json').then(data => {
        if (!data) return;
        setElementText('txt-telefono', data.telefono);
        setElementText('txt-email', data.email);
        setElementText('txt-direccion', data.direccion);
    });

    // Inicio / Hero
    fetchJson('/content/inicio.json').then(data => {
        if (!data) return;
        setElementText('txt-titulo-hero', data.titulo);
        setElementText('txt-subtitulo-hero', data.subtitulo);
        setElementText('txt-span-hero', data.span);
        setElementImage('imagen_hero', data.imagen_hero);
        setElementText('txt-btn-hero', data.texto_boton);
    });

    // Nosotros
    fetchJson('/content/nosotros.json').then(data => {
        if (!data) return;
        for (let i = 1; i <= 3; i++) {
            setElementText(`txt-feat${i}-titulo`, data[`feat${i}_titulo`]);
            setElementText(`txt-feat${i}-sub`, data[`feat${i}_sub`]);
            setElementText(`txt-paso${i}-titulo`, data[`paso${i}_titulo`]);
            setElementText(`txt-paso${i}-desc`, data[`paso${i}_desc`]);
        }
        setElementImage('img-lucas', data.imagen_lucas);
        setElementText('txt-lucas-titulo', data.lucas_titulo);
        setElementText('txt-lucas-p1', data.lucas_p1);
        setElementText('txt-lucas-p2', data.lucas_p2);
        setElementText('txt-pasos-titulo', data.pasos_titulo);
    });

    /* --- LÓGICA DE TRABAJOS Y CARRUSEL INFINITO --- */
    fetchJson('/content/trabajos.json').then(data => {
        if (!data) return;

        const track = document.getElementById("carousel-track");

        // 1. Llenar o mantener tarjetas según el CMS
        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById(`card-t${i}`);
            if (!card) continue;

            const titulo = data[`t${i}_titulo`];
            const antes = data[`t${i}_antes`];
            const despues = data[`t${i}_despues`];

            // Si el dueño cargó fotos y título para esta tarjeta en el CMS
            if (antes && despues) {
                card.classList.remove("placeholder-card", "flex", "flex-col", "items-center", "justify-center", "text-center", "p-6");
                card.classList.add("cursor-pointer", "group");
                card.dataset.antes = antes;
                card.dataset.despues = despues;
                card.dataset.titulo = titulo || `Trabajo ${i}`;

                card.innerHTML = `
                    <img src="${despues}" alt="${titulo || 'Trabajo'}" class="w-full h-full object-cover">
                    <span class="absolute top-4 right-4 bg-[#B81D25] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">Después</span>
                    <div class="image-before absolute inset-0 w-full h-full z-20 opacity-0 transition-opacity duration-500 md:group-hover:opacity-100 bg-gray-900 pointer-events-none md:pointer-events-auto">
                        <img src="${antes}" alt="${titulo || 'Trabajo'} antes" class="w-full h-full object-cover">
                        <span class="absolute top-4 left-4 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full z-10">Antes</span>
                    </div>
                `;
            }
        }

        // 2. Clonación exacta de TODAS las tarjetas del track para el loop infinito perfecto
        if (track) {
            // Limpiar clones previos si recarga
            const originalCards = Array.from(track.children).filter(c => !c.dataset.cloned);
            track.innerHTML = '';

            originalCards.forEach(card => track.appendChild(card));

            // Duplicar elementos para hacer la pista infinita
            originalCards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.dataset.cloned = "true";
                track.appendChild(clone);
            });
        }
    });

    // FAQ Dinámico
    fetchJson('/content/faq.json').then(data => {
        const container = document.getElementById('faq-container');
        if (!container || !data?.faqs) return;

        container.innerHTML = data.faqs.map(item => `
            <div class="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <button class="faq-btn w-full text-left px-6 py-4 font-bold text-gray-800 flex justify-between items-center focus:outline-none hover:bg-gray-50 transition-colors">
                    <span>${item.pregunta}</span>
                    <svg class="w-5 h-5 text-[#B81D25] transform rotate-0 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                <div class="faq-content max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-in-out">
                    <p class="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">${item.respuesta}</p>
                </div>
            </div>
        `).join('');
    });

    // Configuración Global
    fetchJson('/content/configuracion.json').then(data => {
        if (!data) return;
        if (data.whatsapp) {
            document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
                const currentHref = link.getAttribute('href');
                const textMatch = currentHref.match(/text=([^&]*)/);
                const message = textMatch ? textMatch[1] : 'Hola%20equipo%20de%20Pinopolis!';
                link.setAttribute('href', `https://wa.me/${data.whatsapp}?text=${message}`);
            });
        }
        setElementText('txt-dias-atencion', data.dias_atencion);
        setElementText('txt-horas-atencion', data.horas_atencion);
    });

    /* --- 4. ENVÍO DE FORMULARIO (FORMSPREE) --- */
    const formContacto = document.getElementById('form-contacto');
    if (formContacto) {
        formContacto.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-enviar-form');
            const msgExito = document.getElementById('msg-exito');
            const formData = new FormData(formContacto);

            btn.disabled = true;
            btn.textContent = 'Enviando...';

            try {
                const response = await fetch(formContacto.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    formContacto.reset();
                    if (msgExito) msgExito.classList.remove('hidden');
                    setTimeout(() => msgExito?.classList.add('hidden'), 5000);
                } else {
                    throw new Error('Error en el servidor');
                }
            } catch (error) {
                console.error('Error al enviar:', error);
                alert('Ocurrió un error al enviar el mensaje. Por favor intenta nuevamente.');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enviar mensaje';
            }
        });
    }

    /* --- 5. VISOR 3D INTERACTIVO --- */
    let scene, camera, renderer, muebleGroup, controls;
    let materialMelamina, materialFrentes, materialManijas, edgesMat;

    const preciosMelamina = {
        blanco: { nombre: 'Melamina Blanca Básica', precioM2: 18000, colorHex: 0xffffff },
        color: { nombre: 'Melamina Color / Liso', precioM2: 23000, colorHex: 0x3b82f6 },
        madera: { nombre: 'Melamina Símil Madera', precioM2: 27000, colorHex: 0xc89d66 },
        premium: { nombre: 'Melamina Línea Premium', precioM2: 35000, colorHex: 0x1f2937 }
    };

    function init3D() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);

        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(2.8, 2.0, 3.5);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.8));

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
        mainLight.position.set(4, 8, 5);
        mainLight.castShadow = true;
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.3);
        fillLight.position.set(-4, 3, -3);
        scene.add(fillLight);

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.25 }));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        muebleGroup = new THREE.Group();
        scene.add(muebleGroup);

        materialMelamina = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.05 });
        materialFrentes = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05 });
        materialManijas = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        edgesMat = new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 1.5 });

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;

        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        generarSelectoresColumnas();
        actualizarMueble();
        animate();
    }

    function animate() {
        requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
    }

    function generarSelectoresColumnas() {
        const numCols = parseInt(document.getElementById('select-columnas').value);
        const container = document.getElementById('columnas-config-container');
        if (!container) return;

        container.innerHTML = '';

        for (let i = 0; i < numCols; i++) {
            const div = document.createElement('div');
            div.className = 'bg-white p-3 rounded-xl border border-gray-200 mb-2 shadow-sm';
            div.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <span class="text-[11px] font-bold text-emerald-700 uppercase">📌 Columna ${i + 1} de ${numCols}</span>
                    <select id="col-${i}-secciones" class="w-full sm:w-auto bg-gray-100 border border-gray-300 rounded-lg p-1.5 text-[11px] font-bold text-gray-700 select-num-secciones">
                        <option value="1"selected>1 Sección</option>
                        <option value="2">2 Secciones</option>
                        <option value="3">3 Secciones</option>
                        <option value="4">4 Secciones</option>
                        <option value="5">5 Secciones</option>
                    </select>
                </div>
                <div id="col-${i}-subopciones" class="space-y-2 text-xs border-t border-gray-100 pt-2"></div>
            `;
            container.appendChild(div);
            actualizarSubopcionesColumna(i);
        }

        container.querySelectorAll('.select-num-secciones').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const colIndex = e.target.id.split('-')[1];
                actualizarSubopcionesColumna(colIndex);
                actualizarMueble();
            });
        });
    }

    function actualizarSubopcionesColumna(colIndex) {
        const selectSecciones = document.getElementById(`col-${colIndex}-secciones`);
        const subopcionesContainer = document.getElementById(`col-${colIndex}-subopciones`);
        if (!selectSecciones || !subopcionesContainer) return;

        const numSec = parseInt(selectSecciones.value);
        subopcionesContainer.innerHTML = '';

        for (let s = 0; s < numSec; s++) {
            subopcionesContainer.innerHTML += `
                <div>
                    <label class="block text-[10px] font-bold text-gray-500 mb-0.5">Sección ${s + 1} (arriba a abajo):</label>
                    <select id="col-${colIndex}-sec-${s}" class="w-full bg-gray-50 border border-gray-300 rounded-lg p-1.5 text-xs selector-zona">
                        <option value="vacio" selected>Vacío / Abierto</option>
                        <option value="estantes-1">1 Estante Interno</option>
                        <option value="estantes-2">2 Estantes Internos</option>
                        <option value="estantes-3">3 Estantes Internos</option>
                        <option value="puerta">Puerta Batible (Sola)</option>
                        <option value="puerta-estantes-1">Puerta + 1 Estante</option>
                        <option value="puerta-estantes-2">Puerta + 2 Estantes</option>
                        <option value="puerta-estantes-3">Puerta + 3 Estantes</option>
                        <option value="cajones-2">Cajonera (2 cajones)</option>
                        <option value="cajones-3">Cajonera (3 cajones)</option>
                        <option value="cajones-4">Cajonera (4 cajones)</option>
                    </select>
                </div>
            `;
        }

        subopcionesContainer.querySelectorAll('.selector-zona').forEach(sel => {
            sel.addEventListener('change', actualizarMueble);
        });
    }

    function crearPlaca(ancho, alto, prof, x, y, z, mat) {
        const geo = new THREE.BoxGeometry(ancho, alto, prof);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        muebleGroup.add(mesh);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgesMat);
        edges.position.copy(mesh.position);
        muebleGroup.add(edges);
        return mesh;
    }

    function renderizarCompartimento(anchoComp, altoComp, profComp, posX, posY, tipo, e) {
        let areaAdicional = 0;

        // Detectar si lleva estantes (solos o combinados con puerta)
        let numEstantes = 0;
        if (tipo.startsWith('estantes-')) {
            numEstantes = parseInt(tipo.split('-')[1]) || 0;
        } else if (tipo.startsWith('puerta-estantes-')) {
            numEstantes = parseInt(tipo.split('-')[2]) || 0;
        }

        // 1. Renderizar estantes internos si los hay
        if (numEstantes > 0) {
            for (let s = 1; s <= numEstantes; s++) {
                const yEstante = (posY - altoComp / 2) + (altoComp / (numEstantes + 1)) * s;
                crearPlaca(anchoComp, e, profComp - 0.03, posX, yEstante, 0, materialMelamina);
                areaAdicional += (anchoComp * profComp);
            }
        }

        // 2. Renderizar Puerta (sola o con estantes)
        if (tipo === 'puerta' || tipo.startsWith('puerta-estantes-')) {
            crearPlaca(anchoComp - 0.005, altoComp - 0.005, 0.018, posX, posY, profComp / 2 + 0.01, materialFrentes);

            const manijaMesh = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.02), materialManijas);
            manijaMesh.position.set(posX - (anchoComp / 2) + 0.03, posY, profComp / 2 + 0.025);
            muebleGroup.add(manijaMesh);

            areaAdicional += (anchoComp * altoComp);
        } 
        // 3. Renderizar Cajones (excluyentes de estantes)
        else if (tipo.startsWith('cajones-')) {
            const numCajones = parseInt(tipo.split('-')[1]) || 3;
            const altoCajon = (altoComp / numCajones) - 0.006;
            const profCuerpo = Math.max(0.2, profComp - 0.08);
            const altoCuerpo = Math.max(0.08, altoCajon * 0.65);
            const eCajon = 0.015;
            const anchoCuerpo = anchoComp - 0.05;

            for (let c = 0; c < numCajones; c++) {
                const yCajon = (posY - altoComp / 2) + (altoCajon / 2) + (c * (altoCajon + 0.006)) + 0.003;

                crearPlaca(anchoComp - 0.005, altoCajon, 0.018, posX, yCajon, profComp / 2 + 0.01, materialFrentes);

                const manijaMesh = new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.14, anchoComp * 0.4), 0.015, 0.02), materialManijas);
                manijaMesh.position.set(posX, yCajon, profComp / 2 + 0.025);
                muebleGroup.add(manijaMesh);

                const zCentroCuerpo = (profComp / 2) - (profCuerpo / 2) - 0.01;
                const yCentroCuerpo = yCajon - (altoCajon / 2) + (altoCuerpo / 2) + 0.01;

                crearPlaca(anchoCuerpo, eCajon, profCuerpo, posX, yCajon - (altoCajon / 2) + (eCajon / 2) + 0.005, zCentroCuerpo, materialMelamina);
                crearPlaca(eCajon, altoCuerpo, profCuerpo, posX - (anchoCuerpo / 2) + (eCajon / 2), yCentroCuerpo, zCentroCuerpo, materialMelamina);
                crearPlaca(eCajon, altoCuerpo, profCuerpo, posX + (anchoCuerpo / 2) - (eCajon / 2), yCentroCuerpo, zCentroCuerpo, materialMelamina);
                crearPlaca(anchoCuerpo - (2 * eCajon), altoCuerpo, eCajon, posX, yCentroCuerpo, zCentroCuerpo - (profCuerpo / 2) + (eCajon / 2), materialMelamina);

                areaAdicional += (anchoComp * altoCajon) + (anchoCuerpo * profCuerpo) + (2 * altoCuerpo * profCuerpo);
            }
        }
        return areaAdicional;
    }

    function construirMueblePorCompartimentos() {
        while (muebleGroup.children.length > 0) {
            const child = muebleGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            muebleGroup.remove(child);
        }

        const ancho = parseFloat(document.getElementById('input-ancho').value);
        const alto = parseFloat(document.getElementById('input-alto').value);
        const prof = parseFloat(document.getElementById('input-prof').value);
        const numColumnas = parseInt(document.getElementById('select-columnas').value);

        const hasTop = document.getElementById('chk-tapa-sup').checked;
        const hasBase = document.getElementById('chk-base').checked;
        const hasLeft = document.getElementById('chk-lateral-izq').checked;
        const hasRight = document.getElementById('chk-lateral-der').checked;
        const hasBack = document.getElementById('chk-fondo').checked;

        const melaminaData = preciosMelamina[document.getElementById('select-melamina').value];
        materialMelamina.color.set(melaminaData.colorHex);
        materialFrentes.color.set(new THREE.Color(melaminaData.colorHex).multiplyScalar(0.92));

        const e = 0.018;
        let areaM2Total = 0;
        let leftOffset = -ancho / 2;
        let interiorAnchoTotal = ancho;

        if (hasLeft) {
            crearPlaca(e, alto, prof, -ancho / 2 + e / 2, alto / 2, 0, materialMelamina);
            interiorAnchoTotal -= e;
            leftOffset += e;
            areaM2Total += (alto * prof);
        }
        if (hasRight) {
            crearPlaca(e, alto, prof, ancho / 2 - e / 2, alto / 2, 0, materialMelamina);
            interiorAnchoTotal -= e;
            areaM2Total += (alto * prof);
        }
        if (hasTop) {
            crearPlaca(ancho, e, prof, 0, alto - e / 2, 0, materialMelamina);
            areaM2Total += (ancho * prof);
        }
        if (hasBase) {
            crearPlaca(ancho, e, prof, 0, e / 2, 0, materialMelamina);
            areaM2Total += (ancho * prof);
        }
        if (hasBack) {
            crearPlaca(ancho, alto, 0.005, 0, alto / 2, -prof / 2 + 0.002, materialMelamina);
            areaM2Total += (ancho * alto);
        }

        const yMin = hasBase ? e : 0;
        const yMax = hasTop ? alto - e : alto;
        const altoInterior = yMax - yMin;
        const anchoColumna = (interiorAnchoTotal - ((numColumnas - 1) * e)) / numColumnas;

        for (let col = 1; col < numColumnas; col++) {
            const posXDivisor = leftOffset + (col * anchoColumna) + ((col - 0.5) * e);
            crearPlaca(e, altoInterior, prof - 0.02, posXDivisor, yMin + altoInterior / 2, 0, materialMelamina);
            areaM2Total += (altoInterior * prof);
        }

        for (let i = 0; i < numColumnas; i++) {
            const posXCol = leftOffset + (anchoColumna / 2) + (i * (anchoColumna + e));
            const selectSecciones = document.getElementById(`col-${i}-secciones`);
            const numSec = selectSecciones ? parseInt(selectSecciones.value) : 1;
            const altoSeccion = (altoInterior - ((numSec - 1) * e)) / numSec;

            for (let s = 1; s < numSec; s++) {
                const yDivisor = yMin + (s * altoSeccion) + ((s - 0.5) * e);
                crearPlaca(anchoColumna, e, prof - 0.02, posXCol, yDivisor, 0, materialMelamina);
                areaM2Total += (anchoColumna * prof);
            }

            for (let s = 0; s < numSec; s++) {
                const realS = numSec - 1 - s;
                const ySeccion = yMin + (realS * (altoSeccion + e)) + (altoSeccion / 2);
                const tipoSec = document.getElementById(`col-${i}-sec-${s}`)?.value || 'vacio';

                areaM2Total += renderizarCompartimento(anchoColumna, altoSeccion, prof, posXCol, ySeccion, tipoSec, e);
            }
        }

        const precioFinal = Math.round((areaM2Total * melaminaData.precioM2) + 40000);
        setElementText('precio-3d', '$ ' + precioFinal.toLocaleString('es-AR'));

        if (controls) controls.target.set(0, alto / 2, 0);
    }

    function actualizarMueble() {
        const ancho = parseFloat(document.getElementById('input-ancho').value);
        const alto = parseFloat(document.getElementById('input-alto').value);
        const prof = parseFloat(document.getElementById('input-prof').value);

        setElementText('val-ancho', ancho.toFixed(2) + ' m');
        setElementText('val-alto', alto.toFixed(2) + ' m');
        setElementText('val-prof', prof.toFixed(2) + ' m');

        construirMueblePorCompartimentos();
    }

    if (document.getElementById('canvas-container')) {
        init3D();

        ['input-ancho', 'input-alto', 'input-prof'].forEach(id => {
            document.getElementById(id).addEventListener('input', actualizarMueble);
        });

        document.getElementById('select-columnas').addEventListener('change', () => {
            generarSelectoresColumnas();
            actualizarMueble();
        });

        ['chk-tapa-sup', 'chk-base', 'chk-lateral-izq', 'chk-lateral-der', 'chk-fondo', 'select-melamina'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', actualizarMueble);
        });
    }
});

// WhatsApp optimizado para 3D
function enviarEspecificaciones3D() {
    const ancho = document.getElementById('val-ancho').innerText;
    const alto = document.getElementById('val-alto').innerText;
    const prof = document.getElementById('val-prof').innerText;
    const numCols = document.getElementById('select-columnas').value;
    const melSelect = document.getElementById('select-melamina');
    const melTexto = melSelect.options[melSelect.selectedIndex].text;
    const precio = document.getElementById('precio-3d').innerText;
    const numeroWA = "5492478507925";

    let detalleInterior = "";
    for (let i = 0; i < parseInt(numCols); i++) {
        const selectSecciones = document.getElementById(`col-${i}-secciones`);
        const numSec = selectSecciones ? parseInt(selectSecciones.value) : 1;
        let partesColumna = [];

        for (let s = 0; s < numSec; s++) {
            const selectSec = document.getElementById(`col-${i}-sec-${s}`);
            if (selectSec && selectSec.value !== 'vacio') {
                partesColumna.push(selectSec.options[selectSec.selectedIndex].text);
            }
        }

        const resumenCol = partesColumna.length > 0 ? partesColumna.join(", ") : "Vacío / Libre";
        detalleInterior += `• Col. ${i + 1}: ${resumenCol}%0A`;
    }

    const msj = `Hola! Diseñé un mueble modular en la web de *Pinopolis*:%0A%0A` +
        `📏 *Medidas Generales:*%0A` +
        `- Ancho: ${ancho}%0A` +
        `- Alto: ${alto}%0A` +
        `- Profundidad: ${prof}%0A%0A` +
        `🧱 *Estructura:*%0A` +
        `- Columnas: ${numCols}%0A` +
        `${detalleInterior}%0A` +
        `🎨 *Terminación:* ${melTexto}%0A` +
        `💰 *Presupuesto Estimado:* ${precio}%0A%0A` +
        `¿Me confirmás cotización y demora?`;

    window.open(`https://wa.me/${numeroWA}?text=${msj}`, '_blank');
}