// script.js

// --- LocalStorage Key ---
const STORAGE_KEY = 'garagemInteligenteDados';

// --- Classe Manutencao ---
class Manutencao {
    constructor(data, tipo, custo, descricao = '') {
        if (!this.validarData(data)) {
            throw new Error("Data inválida fornecida para manutenção.");
        }
        if (typeof tipo !== 'string' || tipo.trim() === '') {
            throw new Error("Tipo de serviço inválido.");
        }
        const custoNum = parseFloat(custo);
        if (isNaN(custoNum) || custoNum < 0) {
            throw new Error("Custo inválido. Deve ser um número não negativo.");
        }

        // Store date as ISO string for easier JSON serialization/parsing
        this.data = new Date(data).toISOString();
        this.tipo = tipo.trim();
        this.custo = custoNum;
        this.descricao = descricao.trim();
    }

    validarData(dataStr) {
        const data = new Date(dataStr);
        return data instanceof Date && !isNaN(data);
    }

    // Helper to get the Date object
    getDataObj() {
        return new Date(this.data);
    }

    // Helper to check if it's a future appointment
    isAgendamento() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Compare dates only, ignore time
        return this.getDataObj() > hoje;
    }

    formatar() {
        const dataFormatada = this.getDataObj().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let base = `<span class="tipo-servico">${this.tipo}</span> em ${dataFormatada} <span class="custo-servico">${custoFormatado}</span>`;
        if (this.descricao) {
            base += ` - Descrição: ${this.descricao}`;
        }
        return base;
    }

    // Method to convert to a plain object for storage
    toPlainObject() {
        return {
            data: this.data, // Already ISO string
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao
        };
    }

    // Static method to create an instance from a plain object (from storage)
    static fromPlainObject(obj) {
        // Need to handle potential date parsing issues if format changes
        // Assuming obj.data is the ISO string
        if (!obj || !obj.data || !obj.tipo || obj.custo === undefined) {
             console.error("Objeto de manutenção inválido recebido do storage:", obj);
             return null; // Or throw an error
        }
        try {
             // Pass the ISO string directly to constructor which expects it now
            return new Manutencao(obj.data, obj.tipo, obj.custo, obj.descricao || '');
        } catch (error) {
            console.error("Erro ao recriar Manutencao do objeto:", obj, error);
            return null;
        }
    }
}


// --- Classes de Veículo (Modificadas) ---
class Veiculo {
    constructor(modelo, cor, imagem = null, ligado = false, velocidade = 0, historicoManutencao = []) {
        this.modelo = modelo;
        this.cor = cor;
        this.imagem = imagem; // Can be data URL
        this.ligado = ligado;
        this.velocidade = velocidade;
        this.volume = 0.5; // Keep volume setting
        this.musica = null; // Keep music handling
        this.musicaTocando = false;
        // Initialize historicoManutencao, ensuring it contains Manutencao instances if loaded
        this.historicoManutencao = historicoManutencao.map(item =>
            item instanceof Manutencao ? item : Manutencao.fromPlainObject(item)
        ).filter(item => item !== null); // Filter out any nulls from failed parsing
    }

    // --- Métodos existentes (ligar, desligar, etc.) ---
    ligar() {
        if (this instanceof Bicicleta) {
           showAlert("Bicicletas não ligam!");
           return;
        }
        if (this.ligado) {
            showAlert("O veículo já está ligado.");
            return;
        }
        playSound("ligar", this.volume);
        this.ligado = true;
        this.updateDisplay();
        salvarGaragem(); // Salvar estado
    }

    desligar() {
         if (this instanceof Bicicleta) {
           showAlert("Bicicletas não desligam!");
           return;
        }
        if (this.voando && this instanceof Aviao) { // Check specific for Aviao
             showAlert("Aterrisse o avião antes de desligar.");
             return;
        }
        if (!this.ligado) {
            showAlert("O veículo já está desligado.");
            return;
        }
        playSound("desligar", this.volume);
        this.ligado = false;
        this.velocidade = 0;
        this.pararMusica(); // Ensure music stops
        this.updateDisplay();
        salvarGaragem(); // Salvar estado
    }

    acelerar(incremento) {
        if (this instanceof Bicicleta) {
            // Bicicletas podem "acelerar" (pedalar mais rápido)
             this.velocidade += incremento / 2; // Slower acceleration for bikes
             this.updateDisplay();
             salvarGaragem();
             return;
        }
        if (!this.ligado) {
            showAlert("O veículo está desligado. Ligue-o para acelerar.");
            return;
        }
         if (this.voando === false && this instanceof Aviao && this.velocidade + incremento > 100) { // Example taxi speed limit
             showAlert("Velocidade máxima em solo atingida. Decole para ir mais rápido.");
             this.velocidade = 100;
        } else {
            playSound("acelerar", this.volume);
            this.velocidade += incremento;
        }
        this.updateDisplay();
        salvarGaragem();
    }

    frear(decremento) {
         if (this.velocidade === 0) {
            showAlert("O veículo já está parado.");
            return;
        }
        if (this.voando && this instanceof Aviao) {
            showAlert("Reduza a altitude ou aterrisse para frear no solo.");
            // Could implement air braking logic here if desired
            return;
        }
        // Play sound only if it's not a bicycle or if it's moving
        if (!(this instanceof Bicicleta) && this.velocidade > 0) {
             playSound("frear", this.volume);
        }
        this.velocidade = Math.max(0, this.velocidade - decremento);
        this.updateDisplay();
        salvarGaragem();
    }

     buzinar() {
         if (this instanceof Bicicleta) {
             // Simulate bell sound? Or just alert.
             playSound("buzina_bike", this.volume); // Assuming you have a bike bell sound
             // showAlert("Trim trim! (Bicicleta)");
             return;
         }
         playSound("buzina", this.volume); // Standard horn
    }

    // --- Music methods remain the same ---
     tocarMusica() {
        if (this instanceof Bicicleta) {
            showAlert("Bicicletas não possuem sistema de som.");
            return;
        }
        if (this.musica && this.musica instanceof Audio) {
            this.musica.volume = this.volume; // Ensure volume is current
            this.musica.play();
            this.musicaTocando = true;
        } else {
            showAlert("Nenhuma música selecionada ou arquivo inválido.");
        }
    }

    pararMusica() {
        if (this.musica && this.musicaTocando && this.musica instanceof Audio) {
            this.musica.pause();
            this.musica.currentTime = 0;
            this.musicaTocando = false;
        }
    }

    // --- Métodos de Manutenção ---
    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
            console.error("Tentativa de adicionar item que não é Manutencao:", manutencao);
            showAlert("Erro interno: Objeto de manutenção inválido.");
            return;
        }
        this.historicoManutencao.push(manutencao);
        // Ordenar por data (mais recente primeiro) - opcional mas útil
        this.historicoManutencao.sort((a, b) => b.getDataObj() - a.getDataObj());
        salvarGaragem(); // Salvar após adicionar
        updateManutencaoDisplay(); // Atualizar a UI
        showAlert("Manutenção registrada/agendada com sucesso!");
    }

    getHistoricoFormatado() {
        const historicoPassado = this.historicoManutencao
            .filter(m => !m.isAgendamento()) // Apenas passadas ou hoje
            .map(m => `<p>${m.formatar()}</p>`); // Usa o método formatar da Manutencao
        return historicoPassado.length > 0 ? historicoPassado.join('') : "<p>Nenhum histórico registrado.</p>";
    }

    getAgendamentosFormatados() {
        const agendamentosFuturos = this.historicoManutencao
            .filter(m => m.isAgendamento()) // Apenas futuras
             .sort((a, b) => a.getDataObj() - b.getDataObj()) // Opcional: mais próximo primeiro
            .map(m => `<p>${m.formatar()}</p>`);
        return agendamentosFuturos.length > 0 ? agendamentosFuturos.join('') : "<p>Nenhum agendamento futuro.</p>";
    }

    // --- Exibir Informações (base) ---
    exibirInformacoesBase() {
         return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado ? 'Sim' : 'Não'}, Velocidade: ${this.velocidade}`;
    }
     // Default implementation (overridden by subclasses)
     exibirInformacoes() {
         return this.exibirInformacoesBase();
     }


    // --- Update Display (base) ---
    updateDisplay() {
        // This function now only updates the core info display, not the maintenance section
        document.getElementById("informacoesVeiculo").innerHTML = this.exibirInformacoes(); // Use innerHTML if formatting needed
        updateVelocidadeDisplay(this.velocidade);
        updateStatusVeiculo(this.ligado);

        // Update specific displays if they exist for this type
        const cargaDisplay = document.getElementById("cargaAtualDisplay");
        if (cargaDisplay) cargaDisplay.style.display = (this instanceof Caminhao) ? 'block' : 'none';
         if (this instanceof Caminhao) {
            document.getElementById("cargaAtualValor").textContent = this.cargaAtual;
         }

        const altitudeDisplay = document.getElementById("altitudeDisplay");
        if (altitudeDisplay) altitudeDisplay.style.display = (this instanceof Aviao) ? 'block' : 'none';
        if (this instanceof Aviao) {
            document.getElementById("altitudeValor").textContent = this.altitude;
        }

         // Update image
        const imagemExibida = document.getElementById("imagemExibida");
         if (this.imagem) {
             imagemExibida.src = this.imagem;
             imagemExibida.style.display = 'block';
         } else {
             imagemExibida.src = '';
             imagemExibida.style.display = 'none';
         }
    }

    // --- Método para conversão para Objeto Simples (para LocalStorage) ---
    toPlainObject() {
        // Base properties
        let plain = {
            tipoVeiculo: this.constructor.name, // Store the class name to know how to rebuild
            modelo: this.modelo,
            cor: this.cor,
            imagem: this.imagem,
            ligado: this.ligado,
            velocidade: this.velocidade,
            historicoManutencao: this.historicoManutencao.map(m => m.toPlainObject()) // Convert maintenance items
        };
        // Add specific properties based on type
        if (this instanceof CarroEsportivo) plain.turboAtivado = this.turboAtivado;
        if (this instanceof Caminhao) {
            plain.capacidadeCarga = this.capacidadeCarga;
            plain.cargaAtual = this.cargaAtual;
        }
        if (this instanceof Aviao) {
            plain.envergadura = this.envergadura;
            plain.altitude = this.altitude;
            plain.voando = this.voando;
        }
         if (this instanceof Bicicleta) {
            plain.tipo = this.tipo;
        }
        // Note: We are NOT saving the 'musica' Audio object or 'volume'.
        // These are runtime states or configurations. Music selection might need separate handling if persistence is desired.
        return plain;
    }
}

// --- Subclasses (com override de exibirInformacoes e toPlainObject se necessário) ---

class Carro extends Veiculo {
    exibirInformacoes() {
        return `[Carro] ${super.exibirInformacoesBase()}`;
    }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, imagem = null, ligado = false, velocidade = 0, historicoManutencao = [], turboAtivado = false) {
        super(modelo, cor, imagem, ligado, velocidade, historicoManutencao);
        this.turboAtivado = turboAtivado;
    }

    ativarTurbo() {
        if (!this.ligado) {
            showAlert("Ligue o carro esportivo antes de ativar o turbo.");
            return;
        }
        if (this.turboAtivado) {
            // Maybe deactivate? Or just inform. Let's inform for now.
            showAlert("O turbo já está ativado.");
            return;
        }
        playSound("turbo", this.volume);
        this.turboAtivado = true;
        this.velocidade += 50;
        showAlert("Turbo ativado! Velocidade aumentada.");
        this.updateDisplay();
        salvarGaragem();
    }

    // Override desligar or frear if turbo needs deactivation implicitly
    desligar() {
        super.desligar();
        this.turboAtivado = false; // Turbo turns off when car turns off
        this.updateDisplay();
        // salvarGaragem() is called in super.desligar()
    }


    exibirInformacoes() {
        return `[Carro Esportivo] ${super.exibirInformacoesBase()}, Turbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`;
    }
    // toPlainObject inherited is likely sufficient unless turbo state needs special handling on load
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga, imagem = null, ligado = false, velocidade = 0, historicoManutencao = [], cargaAtual = 0) {
        super(modelo, cor, imagem, ligado, velocidade, historicoManutencao);
        this.capacidadeCarga = parseInt(capacidadeCarga) || 1000; // Default capacity
        this.cargaAtual = cargaAtual;
    }

    carregar(quantidade) {
        const quantNum = parseInt(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) {
            showAlert("Quantidade inválida para carregar.");
            return;
        }
        if (this.cargaAtual + quantNum > this.capacidadeCarga) {
            showAlert(`Capacidade máxima de carga (${this.capacidadeCarga}) excedida. Pode carregar no máximo mais ${this.capacidadeCarga - this.cargaAtual}.`);
            return;
        }
        this.cargaAtual += quantNum;
        // Optional: Play loading sound
        showAlert(`${quantNum} unidades carregadas. Carga atual: ${this.cargaAtual}`);
        this.updateDisplay();
        salvarGaragem();
    }

    descarregar(quantidade) {
        const quantNum = parseInt(quantidade);
         if (isNaN(quantNum) || quantNum <= 0) {
            showAlert("Quantidade inválida para descarregar.");
            return;
        }
        if (quantNum > this.cargaAtual) {
            showAlert(`Não é possível descarregar ${quantNum}. Carga atual é ${this.cargaAtual}.`);
            return;
        }
        this.cargaAtual = Math.max(0, this.cargaAtual - quantNum);
        // Optional: Play unloading sound
         showAlert(`${quantNum} unidades descarregadas. Carga atual: ${this.cargaAtual}`);
        this.updateDisplay();
        salvarGaragem();
    }

    exibirInformacoes() {
        return `[Caminhão] ${super.exibirInformacoesBase()}, Capacidade: ${this.capacidadeCarga}, Carga Atual: ${this.cargaAtual}`;
    }
    // updateDisplay in Veiculo handles showing/hiding cargaAtualDisplay
    // toPlainObject in Veiculo handles saving specific properties
}

class Aviao extends Veiculo {
     constructor(modelo, cor, envergadura, imagem = null, ligado = false, velocidade = 0, historicoManutencao = [], altitude = 0, voando = false) {
        super(modelo, cor, imagem, ligado, velocidade, historicoManutencao);
        this.envergadura = parseFloat(envergadura) || 30; // Default envergadura
        this.altitude = altitude;
        this.voando = voando;
    }

    decolar() {
        if (!this.ligado) {
            showAlert("Ligue o avião antes de decolar.");
            return;
        }
        if (this.voando) {
            showAlert("O avião já está voando.");
            return;
        }
         if (this.velocidade < 80) { // Example minimum takeoff speed
             showAlert(`Velocidade insuficiente (${this.velocidade}). Acelere até pelo menos 80 para decolar.`);
             return;
         }
        playSound("decolar", this.volume);
        this.voando = true;
        this.altitude = 1000; // Initial altitude
        showAlert("Decolagem autorizada! Subindo para 1000m.");
        this.updateDisplay();
        salvarGaragem();
    }

    aterrissar() {
        if (!this.voando) {
            showAlert("O avião já está no chão.");
            return;
        }
         // Optional: Add speed check for landing
         if (this.velocidade > 120) {
             showAlert(`Velocidade muito alta (${this.velocidade}) para pousar. Reduza para menos de 120.`);
             return;
         }
        playSound("aterrissar", this.volume);
        this.voando = false;
        this.altitude = 0;
        // Gradually reduce speed upon landing?
        // this.velocidade = Math.min(this.velocidade, 60); // Example landing speed reduction
        showAlert("Pouso concluído. Altitude: 0m.");
        this.updateDisplay();
        salvarGaragem();
    }

    // Override frear, desligar, acelerar as needed from original code
     frear(decremento) { // Override base frear
        if (this.voando) {
            showAlert("Reduza a altitude ou aterrisse para usar os freios de solo.");
             // Implement air speed reduction logic here if desired
             // this.velocidade = Math.max(50, this.velocidade - decremento / 2); // Slower reduction in air?
        } else {
             // Use ground braking only when not flying
             if (this.velocidade > 0) {
                  playSound("frear", this.volume);
                  this.velocidade = Math.max(0, this.velocidade - decremento);
             } else {
                  showAlert("O avião já está parado.");
             }
        }
        this.updateDisplay();
        salvarGaragem();
    }

    desligar() { // Override base desligar
        if (this.voando) {
            showAlert("Aterrisse o avião antes de desligar.");
            return;
        }
        super.desligar(); // Call parent desligar logic
         // No need to call salvarGaragem() again, super does it.
    }


    exibirInformacoes() {
        return `[Avião] ${super.exibirInformacoesBase()}, Envergadura: ${this.envergadura}m, Altitude: ${this.altitude}m, Voando: ${this.voando ? 'Sim' : 'Não'}`;
    }
    // updateDisplay in Veiculo handles showing/hiding altitudeDisplay
    // toPlainObject in Veiculo handles saving specific properties
}

class Moto extends Veiculo {
    exibirInformacoes() {
        return `[Moto] ${super.exibirInformacoesBase()}`;
    }
    // updateDisplay and toPlainObject inherited are sufficient
}

class Bicicleta extends Veiculo {
    constructor(modelo, cor, tipo, imagem = null, velocidade = 0, historicoManutencao = []) {
        // Bicycles are never 'ligado' in the engine sense
        super(modelo, cor, imagem, false, velocidade, historicoManutencao);
        this.tipo = tipo || 'Urbana'; // Default type
    }

    // Override methods that don't apply or behave differently
    ligar() {
        showAlert("Bicicletas não têm motor para ligar.");
    }

    desligar() {
         showAlert("Bicicletas não têm motor para desligar.");
    }

     buzinar() {
        // Play a bell sound if available, otherwise alert
        playSound("buzina_bike", this.volume); // Use a specific sound
        // showAlert("Trim trim!");
    }

     acelerar(incremento) { // Override acceleration logic
         this.velocidade += incremento / 2; // Pedal power is less than engine power
         this.updateDisplay();
         salvarGaragem();
     }

     frear(decremento) { // Override braking logic
         // No sound for bike brakes, or a different one?
         this.velocidade = Math.max(0, this.velocidade - decremento);
         this.updateDisplay();
         salvarGaragem();
     }

     tocarMusica() {
         showAlert("Bicicletas não têm sistema de som integrado.");
     }
     pararMusica() { /* Does nothing */ }


    exibirInformacoes() {
        // Don't show 'Ligado' status for bikes
        return `[Bicicleta] Modelo: ${this.modelo}, Cor: ${this.cor}, Tipo: ${this.tipo}, Velocidade: ${this.velocidade}`;
    }

    // updateDisplay inherited handles speed. Status is always 'Desligado' visually, which is fine.
    // toPlainObject inherited handles saving specific properties
}


// --- Variáveis Globais ---
let garagem = {
    carro: null,
    esportivo: null,
    caminhao: null,
    aviao: null,
    moto: null,
    bicicleta: null
};
let veiculoSelecionado = null; // String com o tipo: 'carro', 'esportivo', etc.

// --- Sons (add bike bell if you have one) ---
const sons = {
    ligar: new Audio('sounds/ligar.mp3'),
    desligar: new Audio('sounds/desligar.mp3'),
    acelerar: new Audio('sounds/aceleracao.mp3'),
    frear: new Audio('sounds/freio.mp3'),
    buzina: new Audio('sounds/buzina.mp3'),
    buzina_bike: new Audio('sounds/bike_bell.mp3'), // Add a bike bell sound file
    turbo: new Audio('sounds/turbo.mp3'),
    decolar: new Audio('sounds/decolar.mp3'),
    aterrissar: new Audio('sounds/aterrissar.mp3')
    // Add sounds for loading/unloading if desired
};

// --- Funções Auxiliares ---

// Alerta
function showAlert(message, type = 'info') { // type can be 'info', 'error', 'success'
    // Replace basic alert with a more sophisticated notification system later if needed
    alert(message);
    if (type === 'error') {
        console.error("Alerta de Erro:", message);
    }
}

// Atualizar Display Velocidade
function updateVelocidadeDisplay(velocidade) {
    const velocidadeValorSpan = document.getElementById("velocidadeValor");
    const progressoVelocidadeDiv = document.getElementById("progressoVelocidade");
    const maxVisualSpeed = 200; // Define a reasonable max for the progress bar display

    velocidadeValorSpan.textContent = Math.round(velocidade); // Show rounded speed
    // Cap the progress bar width at 100% based on maxVisualSpeed
    const percent = Math.min(100, (velocidade / maxVisualSpeed) * 100);
    progressoVelocidadeDiv.style.width = `${percent}%`;
}

// Atualizar Status Veículo
function updateStatusVeiculo(ligado) {
    const statusVeiculoDiv = document.getElementById("statusVeiculo");
     // For bikes, we might always want it to show "Pronta" or hide status
    const veiculoAtual = garagem[veiculoSelecionado];
     if (veiculoAtual instanceof Bicicleta) {
        statusVeiculoDiv.textContent = "Pronta"; // Or hide it: statusVeiculoDiv.style.display = 'none';
        statusVeiculoDiv.className = "status-pronta"; // Add a specific class if needed
    } else if (ligado) {
        statusVeiculoDiv.textContent = "Ligado";
        statusVeiculoDiv.className = "status-ligado";
        // statusVeiculoDiv.style.display = 'block';
    } else {
        statusVeiculoDiv.textContent = "Desligado";
        statusVeiculoDiv.className = "status-desligado";
         // statusVeiculoDiv.style.display = 'block';
    }
}

// Tocar Som
function playSound(nomeSom, volume) {
    if (sons[nomeSom] && sons[nomeSom] instanceof Audio) {
        sons[nomeSom].volume = volume;
        sons[nomeSom].currentTime = 0; // Reset before playing
        sons[nomeSom].play().catch(e => console.warn(`Não foi possível tocar o som "${nomeSom}": ${e.message}`));
    } else {
        console.warn(`Som "${nomeSom}" não encontrado ou inválido.`);
    }
}

// Atualizar Volume Geral
const volumeGeralInput = document.getElementById("volumeGeral");
function updateVolume() {
    const volume = parseFloat(volumeGeralInput.value);
    // Update sound effects volume
    for (const som in sons) {
        if (sons.hasOwnProperty(som) && sons[som] instanceof Audio) {
            sons[som].volume = volume;
        }
    }
    // Update current vehicle's music volume IF it's playing
    let veiculo = garagem[veiculoSelecionado];
    if (veiculo && veiculo.musica && veiculo.musica instanceof Audio) {
        veiculo.volume = volume; // Store volume preference on vehicle
        if (veiculo.musicaTocando) {
             veiculo.musica.volume = volume;
        }
    }
}
volumeGeralInput.addEventListener("input", updateVolume);

// --- Funções de Persistência (LocalStorage) ---

function salvarGaragem() {
    try {
        const garagemParaSalvar = {};
        for (const tipo in garagem) {
            if (garagem[tipo] instanceof Veiculo) {
                 // Use the toPlainObject method for serialization
                garagemParaSalvar[tipo] = garagem[tipo].toPlainObject();
            } else {
                garagemParaSalvar[tipo] = null; // Keep null placeholders
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(garagemParaSalvar));
        console.log("Garagem salva no LocalStorage.");
    } catch (error) {
        console.error("Erro ao salvar garagem no LocalStorage:", error);
        showAlert("Erro ao salvar dados da garagem.", 'error');
    }
}

function carregarGaragem() {
    try {
        const dadosSalvos = localStorage.getItem(STORAGE_KEY);
        if (!dadosSalvos) {
            console.log("Nenhum dado salvo encontrado.");
            return; // No data to load
        }

        const garagemSalva = JSON.parse(dadosSalvos);
        const garagemRecuperada = {};

        for (const tipo in garagemSalva) {
            const veiculoData = garagemSalva[tipo];
            if (veiculoData && veiculoData.tipoVeiculo) { // Check if it's vehicle data
                 // Re-instantiate the correct class based on stored type
                 let veiculoRecuperado = null;
                 const historico = veiculoData.historicoManutencao || []; // Default to empty array

                 // Map plain maintenance objects back to Manutencao instances
                 const historicoInstancias = historico.map(m => Manutencao.fromPlainObject(m)).filter(Boolean); // Filter out nulls

                 switch (veiculoData.tipoVeiculo) {
                    case 'Carro':
                        veiculoRecuperado = new Carro(veiculoData.modelo, veiculoData.cor, veiculoData.imagem, veiculoData.ligado, veiculoData.velocidade, historicoInstancias);
                        break;
                    case 'CarroEsportivo':
                        veiculoRecuperado = new CarroEsportivo(veiculoData.modelo, veiculoData.cor, veiculoData.imagem, veiculoData.ligado, veiculoData.velocidade, historicoInstancias, veiculoData.turboAtivado);
                        break;
                    case 'Caminhao':
                         veiculoRecuperado = new Caminhao(veiculoData.modelo, veiculoData.cor, veiculoData.capacidadeCarga, veiculoData.imagem, veiculoData.ligado, veiculoData.velocidade, historicoInstancias, veiculoData.cargaAtual);
                        break;
                    case 'Aviao':
                        veiculoRecuperado = new Aviao(veiculoData.modelo, veiculoData.cor, veiculoData.envergadura, veiculoData.imagem, veiculoData.ligado, veiculoData.velocidade, historicoInstancias, veiculoData.altitude, veiculoData.voando);
                        break;
                    case 'Moto':
                        veiculoRecuperado = new Moto(veiculoData.modelo, veiculoData.cor, veiculoData.imagem, veiculoData.ligado, veiculoData.velocidade, historicoInstancias);
                        break;
                    case 'Bicicleta':
                         // Note: Bikes don't have 'ligado' state passed to constructor typically
                         veiculoRecuperado = new Bicicleta(veiculoData.modelo, veiculoData.cor, veiculoData.tipo, veiculoData.imagem, veiculoData.velocidade, historicoInstancias);
                        break;
                    default:
                        console.warn(`Tipo de veículo desconhecido encontrado no storage: ${veiculoData.tipoVeiculo}`);
                 }
                 garagemRecuperada[tipo] = veiculoRecuperado;

            } else {
                 garagemRecuperada[tipo] = null; // Keep null if no vehicle data
            }
        }
        garagem = garagemRecuperada; // Replace global garagem object
        console.log("Garagem carregada do LocalStorage.");
        // Initially select the first available vehicle if any exist
        const firstAvailable = Object.keys(garagem).find(tipo => garagem[tipo] !== null);
         if (firstAvailable) {
            // Simulate a click on the corresponding button to select it
            const button = document.querySelector(`#selecao-veiculo button[data-tipo='${firstAvailable}']`);
            if (button) {
                button.click(); // Trigger selection logic
            } else {
                 veiculoSelecionado = firstAvailable; // Fallback if button not found
                 updateInfoVeiculo(); // Manually update if click fails
            }

        } else {
            updateInfoVeiculo(); // Update display even if empty
        }


    } catch (error) {
        console.error("Erro ao carregar garagem do LocalStorage:", error);
        showAlert("Erro ao carregar dados salvos. Os dados podem estar corrompidos.", 'error');
        // Optional: Clear corrupted storage
        // localStorage.removeItem(STORAGE_KEY);
        garagem = { carro: null, esportivo: null, caminhao: null, aviao: null, moto: null, bicicleta: null }; // Reset garage
    }
}


// --- Atualizar Display de Manutenção ---
function updateManutencaoDisplay() {
    const veiculo = garagem[veiculoSelecionado];
    const historicoDiv = document.getElementById("historicoManutencaoLista");
    const agendamentosDiv = document.getElementById("agendamentosFuturosLista");
    const manutencaoSection = document.getElementById("manutencao-veiculo");

    if (veiculo instanceof Veiculo) { // Check if it's a valid vehicle instance
        historicoDiv.innerHTML = veiculo.getHistoricoFormatado();
        agendamentosDiv.innerHTML = veiculo.getAgendamentosFormatados();
        manutencaoSection.style.display = 'block'; // Show the section
        verificarLembretesManutencao(veiculo); // Check for reminders
    } else {
        historicoDiv.innerHTML = "Selecione um veículo para ver o histórico.";
        agendamentosDiv.innerHTML = "Selecione um veículo para ver os agendamentos.";
        manutencaoSection.style.display = 'none'; // Hide if no vehicle selected
    }
}

// --- Verificar Lembretes (Exemplo Simples) ---
function verificarLembretesManutencao(veiculo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const agendamentos = veiculo.historicoManutencao.filter(m => m.isAgendamento());

    agendamentos.forEach(m => {
        const dataManutencao = m.getDataObj();
        dataManutencao.setHours(0,0,0,0); // Compare only dates

        if (dataManutencao.getTime() === hoje.getTime()) {
            showAlert(`Lembrete: Manutenção (${m.tipo}) do ${veiculo.modelo} agendada para HOJE!`);
        } else if (dataManutencao.getTime() === amanha.getTime()) {
             showAlert(`Lembrete: Manutenção (${m.tipo}) do ${veiculo.modelo} agendada para AMANHÃ!`);
        }
    });
}


// --- Atualizar Display Geral ---
function updateInfoVeiculo() {
    const veiculo = garagem[veiculoSelecionado]; // Get current vehicle based on selection
    const infoDiv = document.getElementById("informacoesVeiculo");
    const imagemExibida = document.getElementById("imagemExibida");
    const manutencaoSection = document.getElementById("manutencao-veiculo");

    // Reset specific fields visibility first
    document.getElementById("labelCapacidadeCarga").style.display = 'none';
    document.getElementById("capacidadeCarga").style.display = 'none';
    document.getElementById("btnCarregar").style.display = 'none';
    document.getElementById("btnDescarregar").style.display = 'none';
    document.getElementById("cargaAtualDisplay").style.display = 'none';
    document.getElementById("labelEnvergadura").style.display = 'none';
    document.getElementById("envergadura").style.display = 'none';
    document.getElementById("btnDecolar").style.display = 'none';
    document.getElementById("btnAterrissar").style.display = 'none';
    document.getElementById("altitudeDisplay").style.display = 'none';
    document.getElementById("labelTipoBicicleta").style.display = 'none';
    document.getElementById("tipoBicicleta").style.display = 'none';
    // Hide turbo button by default
    document.querySelector('button[data-acao="turbo"]').style.display = 'none';


    if (veiculo instanceof Veiculo) {
        veiculo.updateDisplay(); // Call the vehicle's own display update
        updateManutencaoDisplay(); // Update maintenance info
        manutencaoSection.style.display = 'block'; // Show maintenance section

        // Show/Hide specific UI elements based on the *selected* vehicle type
        const isCaminhao = veiculo instanceof Caminhao;
        const isAviao = veiculo instanceof Aviao;
        const isBicicleta = veiculo instanceof Bicicleta;
        const isEsportivo = veiculo instanceof CarroEsportivo;

        document.getElementById("btnCarregar").style.display = isCaminhao ? 'inline-block' : 'none';
        document.getElementById("btnDescarregar").style.display = isCaminhao ? 'inline-block' : 'none';
        document.getElementById("cargaAtualDisplay").style.display = isCaminhao ? 'block' : 'none';

        document.getElementById("btnDecolar").style.display = isAviao ? 'inline-block' : 'none';
        document.getElementById("btnAterrissar").style.display = isAviao ? 'inline-block' : 'none';
        document.getElementById("altitudeDisplay").style.display = isAviao ? 'block' : 'none';

         // Show Turbo button only for CarroEsportivo
         document.querySelector('button[data-acao="turbo"]').style.display = isEsportivo ? 'inline-block' : 'none';


        // Hide irrelevant buttons for bicycle
        if (isBicicleta) {
             document.querySelector('button[data-acao="ligar"]').style.display = 'none';
             document.querySelector('button[data-acao="desligar"]').style.display = 'none';
             // Buzinar might be kept for the bell sound
             document.querySelector('button[data-acao="turbo"]').style.display = 'none';
             document.getElementById("btnTocarMusica").style.display = 'none';
             document.getElementById("btnPararMusica").style.display = 'none';
             document.getElementById("musicaInput").style.display = 'none';
             document.getElementById("nomeMusica").style.display = 'none';

        } else {
             // Ensure buttons are visible for non-bikes
             document.querySelector('button[data-acao="ligar"]').style.display = 'inline-block';
             document.querySelector('button[data-acao="desligar"]').style.display = 'inline-block';
             document.getElementById("btnTocarMusica").style.display = 'inline-block';
             document.getElementById("btnPararMusica").style.display = 'inline-block';
             document.getElementById("musicaInput").style.display = 'inline-block';
             document.getElementById("nomeMusica").style.display = 'block';
        }


    } else {
        infoDiv.textContent = "Nenhum veículo criado ou selecionado.";
        imagemExibida.style.display = 'none';
        imagemExibida.src = '';
        updateVelocidadeDisplay(0);
        updateStatusVeiculo(false); // Show as Desligado by default
        manutencaoSection.style.display = 'none'; // Hide maintenance section
         // Ensure all specific buttons/displays are hidden
         document.getElementById("cargaAtualDisplay").style.display = 'none';
         document.getElementById("altitudeDisplay").style.display = 'none';
         document.getElementById("btnCarregar").style.display = 'none';
         document.getElementById("btnDescarregar").style.display = 'none';
         document.getElementById("btnDecolar").style.display = 'none';
         document.getElementById("btnAterrissar").style.display = 'none';
         document.querySelector('button[data-acao="turbo"]').style.display = 'none';

    }
}


// --- Event Listeners ---

// Seleção de Veículo
document.querySelectorAll("#selecao-veiculo button").forEach(button => {
    button.addEventListener("click", function () {
        veiculoSelecionado = this.dataset.tipo;
        console.log("Veículo selecionado:", veiculoSelecionado);

        // Reset form fields for safety
        document.getElementById("modelo").value = '';
        document.getElementById("cor").value = '';
        document.getElementById("imagem").value = '';
        document.getElementById("capacidadeCarga").value = '';
        document.getElementById("envergadura").value = '';
        // Reset selects if necessary

        // Show/Hide fields in "Criar/Modificar" section based on NEW selection
        const isCaminhao = veiculoSelecionado === 'caminhao';
        const isAviao = veiculoSelecionado === 'aviao';
        const isBicicleta = veiculoSelecionado === 'bicicleta';

        document.getElementById("labelCapacidadeCarga").style.display = isCaminhao ? 'block' : 'none';
        document.getElementById("capacidadeCarga").style.display = isCaminhao ? 'block' : 'none';

        document.getElementById("labelEnvergadura").style.display = isAviao ? 'block' : 'none';
        document.getElementById("envergadura").style.display = isAviao ? 'block' : 'none';

        document.getElementById("labelTipoBicicleta").style.display = isBicicleta ? 'block' : 'none';
        document.getElementById("tipoBicicleta").style.display = isBicicleta ? 'block' : 'none';

         // Pre-fill form if modifying an existing vehicle of this type
         const veiculoExistente = garagem[veiculoSelecionado];
         if (veiculoExistente) {
             document.getElementById("modelo").value = veiculoExistente.modelo;
             document.getElementById("cor").value = veiculoExistente.cor;
             // Image cannot be pre-filled in file input for security reasons
             if (isCaminhao) document.getElementById("capacidadeCarga").value = veiculoExistente.capacidadeCarga;
             if (isAviao) document.getElementById("envergadura").value = veiculoExistente.envergadura;
             if (isBicicleta) document.getElementById("tipoBicicleta").value = veiculoExistente.tipo;
         }


        // Update the main info display area for the selected vehicle
        updateInfoVeiculo();
    });
});

// Criar/Modificar Veículo
document.getElementById("btnCriarVeiculo").addEventListener("click", function () {
    if (!veiculoSelecionado) {
        showAlert("Selecione um tipo de veículo primeiro!", 'error');
        return;
    }

    const modelo = document.getElementById("modelo").value.trim();
    const cor = document.getElementById("cor").value.trim();
    const imagemInput = document.getElementById("imagem");
    const capacidadeCarga = document.getElementById("capacidadeCarga").value;
    const envergadura = document.getElementById("envergadura").value;
    const tipoBicicleta = document.getElementById("tipoBicicleta").value;

    if (!modelo || !cor) {
        showAlert("Modelo e Cor são obrigatórios!", 'error');
        return;
    }

    // Function to actually create/update the vehicle after image is processed (if any)
    const assignVehicle = (imagemURL = null) => {
        let veiculo;
        const veiculoExistente = garagem[veiculoSelecionado];
        const historicoExistente = veiculoExistente ? veiculoExistente.historicoManutencao : [];

        try {
            switch (veiculoSelecionado) {
                case 'carro':
                    veiculo = new Carro(modelo, cor, imagemURL, false, 0, historicoExistente);
                    break;
                case 'esportivo':
                    veiculo = new CarroEsportivo(modelo, cor, imagemURL, false, 0, historicoExistente);
                    break;
                case 'caminhao':
                    if (!capacidadeCarga || isNaN(parseInt(capacidadeCarga))) throw new Error("Capacidade de Carga inválida.");
                    veiculo = new Caminhao(modelo, cor, capacidadeCarga, imagemURL, false, 0, historicoExistente);
                    break;
                case 'aviao':
                     if (!envergadura || isNaN(parseFloat(envergadura))) throw new Error("Envergadura inválida.");
                    veiculo = new Aviao(modelo, cor, envergadura, imagemURL, false, 0, historicoExistente);
                    break;
                case 'moto':
                    veiculo = new Moto(modelo, cor, imagemURL, false, 0, historicoExistente);
                    break;
                case 'bicicleta':
                    veiculo = new Bicicleta(modelo, cor, tipoBicicleta, imagemURL, 0, historicoExistente);
                    break;
                default:
                    throw new Error("Tipo de veículo inválido selecionado."); // Should not happen
            }

            garagem[veiculoSelecionado] = veiculo;
            salvarGaragem(); // Save after creation/modification
            updateInfoVeiculo(); // Update display
            showAlert(`Veículo (${veiculoSelecionado}) ${veiculoExistente ? 'modificado' : 'criado'} com sucesso!`, 'success');

        } catch (error) {
            showAlert(`Erro ao criar/modificar veículo: ${error.message}`, 'error');
        }
    };

    // Handle image loading (asynchronous)
    if (imagemInput.files && imagemInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
             // Check if image is too large? (Optional)
            assignVehicle(e.target.result); // Pass Data URL
        }
        reader.onerror = function (e) {
             showAlert("Erro ao ler o arquivo de imagem.", 'error');
             assignVehicle(garagem[veiculoSelecionado]?.imagem); // Try to proceed with old image if modifying
        }
        reader.readAsDataURL(imagemInput.files[0]);
    } else {
        // Assign vehicle immediately if no new image, using existing image if modifying
        assignVehicle(garagem[veiculoSelecionado]?.imagem);
    }
});


// Ações do Veículo
document.querySelectorAll("#acoes-veiculo button").forEach(button => {
    button.addEventListener("click", function () {
        const acao = this.dataset.acao;
        const veiculo = garagem[veiculoSelecionado];

        if (!veiculo && !(acao === 'ligar' || acao === 'desligar' || acao === 'acelerar' || acao === 'frear' || acao === 'buzinar')) {
             // Allow basic actions even if bike is selected, class methods handle specific logic
        } else if (!veiculo) {
             showAlert("Crie ou selecione um veículo primeiro!", 'error');
            return;
        }


        // Use try-catch for actions that might throw errors (like loading invalid amounts)
        try {
            switch (acao) {
                case 'ligar':       veiculo.ligar(); break;
                case 'desligar':    veiculo.desligar(); break;
                case 'acelerar':    veiculo.acelerar(10); break; // Increment standard
                case 'frear':       veiculo.frear(10); break;    // Decrement standard (adjust per vehicle?)
                case 'buzinar':     veiculo.buzinar(); break;
                case 'turbo':
                    if (veiculo instanceof CarroEsportivo) veiculo.ativarTurbo();
                    else showAlert("Apenas carros esportivos podem ativar o turbo.");
                    break;
                case 'carregar':
                    if (veiculo instanceof Caminhao) {
                        const quantidadeC = prompt("Quantidade para carregar:");
                        if (quantidadeC !== null) veiculo.carregar(quantidadeC); // Let method handle validation
                    } else showAlert("Apenas caminhões podem ser carregados.");
                    break;
                case 'descarregar':
                    if (veiculo instanceof Caminhao) {
                        const quantidadeD = prompt("Quantidade para descarregar:");
                         if (quantidadeD !== null) veiculo.descarregar(quantidadeD);
                    } else showAlert("Apenas caminhões podem ser descarregados.");
                    break;
                case 'decolar':
                    if (veiculo instanceof Aviao) veiculo.decolar();
                    else showAlert("Apenas aviões podem decolar.");
                    break;
                case 'aterrissar':
                    if (veiculo instanceof Aviao) veiculo.aterrissar();
                    else showAlert("Apenas aviões podem aterrissar.");
                    break;
                default:
                    console.warn("Ação desconhecida:", acao);
            }
             // updateInfoVeiculo() is implicitly called by most vehicle methods via updateDisplay()
             // and salvarGaragem() is also called internally now.
        } catch (error) {
             showAlert(`Erro ao executar ação "${acao}": ${error.message}`, 'error');
        }
    });
});

// Controles de Música (Handle potential errors and bike case)
document.getElementById("btnTocarMusica").addEventListener("click", function () {
    let veiculo = garagem[veiculoSelecionado];
    if (veiculo instanceof Bicicleta) {
         showAlert("Bicicletas não possuem sistema de som.");
         return;
    }
    if (veiculo instanceof Veiculo) { // Check if it's a valid vehicle instance
        veiculo.tocarMusica();
    } else {
        showAlert("Selecione ou crie um veículo primeiro.", 'error');
    }
});

document.getElementById("btnPararMusica").addEventListener("click", function () {
    let veiculo = garagem[veiculoSelecionado];
     if (veiculo instanceof Bicicleta) {
         // No action needed, maybe disable button?
         return;
    }
    if (veiculo instanceof Veiculo) {
        veiculo.pararMusica();
    } else {
        showAlert("Selecione ou crie um veículo primeiro.", 'error');
    }
});

document.getElementById("musicaInput").addEventListener("change", function (event) {
    let veiculo = garagem[veiculoSelecionado];
     if (veiculo instanceof Bicicleta) {
         showAlert("Bicicletas não podem ter música selecionada.");
         event.target.value = ""; // Clear the input
         return;
    }
    if (!veiculo) {
        showAlert("Selecione ou crie um veículo primeiro.", 'error');
         event.target.value = ""; // Clear the input
        return;
    }

    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (veiculo.musica && veiculo.musica instanceof Audio) {
                veiculo.pararMusica(); // Stop previous music
            }
            try {
                veiculo.musica = new Audio(e.target.result);
                veiculo.musica.loop = true;
                veiculo.musica.volume = veiculo.volume; // Use vehicle's stored volume setting
                 document.getElementById("nomeMusica").textContent = `Música: ${file.name}`;
                 // Note: Music selection is not saved to LocalStorage in this version
            } catch (error) {
                 showAlert(`Erro ao carregar arquivo de áudio: ${error.message}`, 'error');
                 document.getElementById("nomeMusica").textContent = "Erro ao carregar música";
                 veiculo.musica = null;
            }
        }
         reader.onerror = function () {
             showAlert("Não foi possível ler o arquivo de música.", 'error');
             document.getElementById("nomeMusica").textContent = "Erro na leitura";
             veiculo.musica = null;
         }
        reader.readAsDataURL(file);
    } else if (file) {
         showAlert("Por favor, selecione um arquivo de áudio válido (mp3, wav, ogg, etc).", 'error');
         event.target.value = ""; // Clear the input
    }
});


// Agendar Manutenção (Form Submission)
document.getElementById("formAgendarManutencao").addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page reload

    const veiculo = garagem[veiculoSelecionado];
    if (!veiculo) {
        showAlert("Selecione um veículo para agendar manutenção.", 'error');
        return;
    }

    const dataInput = document.getElementById("manutencaoData");
    const tipoInput = document.getElementById("manutencaoTipo");
    const custoInput = document.getElementById("manutencaoCusto");
    const descricaoInput = document.getElementById("manutencaoDescricao");

    const data = dataInput.value;
    const tipo = tipoInput.value;
    const custo = custoInput.value;
    const descricao = descricaoInput.value;

    // Basic validation (more robust in Manutencao constructor)
    if (!data || !tipo || custo === '') {
         showAlert("Data, Tipo e Custo são obrigatórios para agendar.", 'error');
         return;
    }

    try {
        // Create Manutencao instance (constructor validates)
        const novaManutencao = new Manutencao(data, tipo, custo, descricao);

        // Add to the selected vehicle
        veiculo.adicionarManutencao(novaManutencao); // This now saves and updates display

        // Clear the form
        // dataInput.value = ''; // Keep date maybe?
        tipoInput.value = '';
        custoInput.value = '';
        descricaoInput.value = '';

    } catch (error) {
        showAlert(`Erro ao agendar manutenção: ${error.message}`, 'error');
    }
});


// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Inicializando Garagem...");
    updateVolume(); // Set initial volume for sounds
    carregarGaragem(); // Load saved data

     // Initialize flatpickr (optional date picker)
     if (typeof flatpickr === "function") {
         flatpickr("#manutencaoData", {
             dateFormat: "Y-m-d", // Match HTML5 date input format
             altInput: true,      // Show user-friendly format
             altFormat: "d/m/Y",
             locale: "pt" // Needs locale file included or configured if using non-standard locales
         });
         // If using a locale file:
         // const Flatpickr = require("flatpickr");
         // const Portuguese = require("flatpickr/dist/l10n/pt.js").default.pt;
         // Flatpickr.localize(Portuguese);
         // flatpickr("#manutencaoData", { altInput: true, altFormat: "d/m/Y", dateFormat: "Y-m-d"});

     }

    // Initial UI update based on loaded data (or default state)
    // updateInfoVeiculo(); // carregarGaragem now handles initial selection and update
    console.log("Garagem Inicializada.");
});