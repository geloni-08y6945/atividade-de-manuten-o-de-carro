// script.js

// Classes
class Veiculo {
    constructor(modelo, cor, imagem = null, ligado = false, velocidade = 0, velocidadeMaxima = 100) {
        this.modelo = modelo;
        this.cor = cor;
        this.imagem = imagem;
        this.ligado = ligado;
        this.velocidade = velocidade;
        this.velocidadeMaxima = velocidadeMaxima;
    }

    ligar() {
        if (this.ligado) {
            showAlert("O veículo já está ligado.");
            return;
        }
        playSound("ligar");
        this.ligado = true;
        this.updateDisplay();
    }

    desligar() {
        if (!this.ligado) {
            showAlert("O veículo já está desligado.");
            return;
        }
        playSound("desligar");
        this.ligado = false;
        this.velocidade = 0;
        this.updateDisplay();
    }

    acelerar(incremento) {
        if (!this.ligado) {
            showAlert("O veículo está desligado. Ligue-o para acelerar.");
            return;
        }
        if (this.velocidade + incremento > this.velocidadeMaxima) {
            showAlert("Velocidade máxima atingida.");
            this.velocidade = this.velocidadeMaxima;
            this.updateDisplay();
            return;
        }
        playSound("acelerar");
        this.velocidade += incremento;
        this.updateDisplay();
    }

    frear(decremento) {
        if (this.velocidade === 0) {
            showAlert("O veículo já está parado.");
            return;
        }
        playSound("frear");
        this.velocidade = Math.max(0, this.velocidade - decremento);
        this.updateDisplay();
    }

    buzinar() {
        playSound("buzina");
    }

    exibirInformacoes() {
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado ? 'Sim' : 'Não'}, Velocidade: ${this.velocidade}`;
    }

    updateDisplay() {
        document.getElementById("informacoesVeiculo").textContent = this.exibirInformacoes();
        updateVelocidadeDisplay(this.velocidade, this.velocidadeMaxima);
        updateStatusVeiculo(this.ligado);
    }
}

class Carro extends Veiculo {
    exibirInformacoes() {
        return `[Carro] ${super.exibirInformacoes()}`;
    }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, imagem = null) {
        super(modelo, cor, imagem);
        this.turboAtivado = false;
    }

    ativarTurbo() {
        if (!this.ligado) {
            showAlert("Ligue o carro esportivo antes de ativar o turbo.");
            return;
        }
        if (this.turboAtivado) {
            showAlert("O turbo já está ativado.");
            return;
        }
        playSound("turbo");
        this.turboAtivado = true;
        this.velocidadeMaxima = 200;
        this.updateDisplay();
    }

    desativarTurbo() {
        if (!this.turboAtivado) {
            showAlert("O turbo já está desativado.");
            return;
        }
        this.turboAtivado = false;
        this.velocidadeMaxima = 100;
        this.updateDisplay();
    }

    exibirInformacoes() {
        return `[Carro Esportivo] ${super.exibirInformacoes()}, Turbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`;
    }
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga, imagem = null) {
        super(modelo, cor, imagem);
        this.capacidadeCarga = capacidadeCarga;
        this.cargaAtual = 0;
    }

    carregar(quantidade) {
        if (this.cargaAtual + quantidade > this.capacidadeCarga) {
            showAlert("Capacidade máxima de carga excedida.");
            return;
        }
        this.cargaAtual += quantidade;
        this.updateDisplay();
    }

    descarregar(quantidade) {
        if (quantidade > this.cargaAtual) {
            showAlert("Não é possível descarregar mais do que a carga atual.");
            return;
        }
        this.cargaAtual = Math.max(0, this.cargaAtual - quantidade);
        this.updateDisplay();
    }

    exibirInformacoes() {
        return `[Caminhão] ${super.exibirInformacoes()}, Capacidade de Carga: ${this.capacidadeCarga}, Carga Atual: ${this.cargaAtual}`;
    }
}

// Global variables
let garagem = {
    carro: null,
    esportivo: null,
    caminhao: null
};
let veiculoSelecionado = null;

// Sons
const sons = {
    ligar: new Audio('sounds/ligar.mp3'),
    desligar: new Audio('sounds/desligar.mp3'),
    acelerar: new Audio('sounds/aceleracao.mp3'),
    frear: new Audio('sounds/freio.mp3'),
    buzina: new Audio('sounds/buzina.mp3'),
    turbo: new Audio('sounds/turbo.mp3')
};

function playSound(nomeSom) {
    sons[nomeSom].play();
}

// Function to display alerts
function showAlert(message) {
    alert(message);
}

// Function to update vehicle status display
function updateStatusVeiculo(ligado) {
    const statusVeiculoDiv = document.getElementById("statusVeiculo");
    if (ligado) {
        statusVeiculoDiv.textContent = "Ligado";
        statusVeiculoDiv.className = "status-ligado";
    } else {
        statusVeiculoDiv.textContent = "Desligado";
        statusVeiculoDiv.className = "status-desligado";
    }
}

// Function to update velocity display
function updateVelocidadeDisplay(velocidade, velocidadeMaxima) {
    const velocidadeValorSpan = document.getElementById("velocidadeValor");
    const progressoVelocidadeDiv = document.getElementById("progressoVelocidade");
    const porcentagem = (velocidade / velocidadeMaxima) * 100;

    velocidadeValorSpan.textContent = velocidade;
    progressoVelocidadeDiv.style.width = `${porcentagem}%`;
}

// Function to select a vehicle type
document.querySelectorAll("#selecao-veiculo button").forEach(button => {
    button.addEventListener("click", function () {
        veiculoSelecionado = this.dataset.tipo;

        // Hide/show specific fields
        document.getElementById("labelCapacidadeCarga").style.display = (veiculoSelecionado === 'caminhao') ? 'block' : 'none';
        document.getElementById("capacidadeCarga").style.display = (veiculoSelecionado === 'caminhao') ? 'block' : 'none';
        document.getElementById("btnTurbo").style.display = (veiculoSelecionado === 'esportivo') ? 'inline-block' : 'none';
        document.getElementById("btnDesativarTurbo").style.display = (veiculoSelecionado === 'esportivo') ? 'inline-block' : 'none';
        document.getElementById("btnCarregar").style.display = (veiculoSelecionado === 'caminhao') ? 'inline-block' : 'none';
        document.getElementById("btnDescarregar").style.display = (veiculoSelecionado === 'caminhao') ? 'inline-block' : 'none';

        updateInfoVeiculo(); // Update display after selection
    });
});

// Function to create/modify a vehicle
document.getElementById("btnCriarVeiculo").addEventListener("click", function () {
    const modelo = document.getElementById("modelo").value;
    const cor = document.getElementById("cor").value;
    const imagemInput = document.getElementById("imagem");
    const capacidadeCarga = document.getElementById("capacidadeCarga").value;
    let imagemURL = null;

    if (imagemInput.files && imagemInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagemURL = e.target.result;
            assignVehicle(modelo, cor, imagemURL, capacidadeCarga);
        }
        reader.readAsDataURL(imagemInput.files[0]);
    } else {
        assignVehicle(modelo, cor, imagemURL, capacidadeCarga);
    }
});

function assignVehicle(modelo, cor, imagemURL, capacidadeCarga) {
    switch (veiculoSelecionado) {
        case 'carro':
            garagem.carro = new Carro(modelo, cor, imagemURL);
            break;
        case 'esportivo':
            garagem.esportivo = new CarroEsportivo(modelo, cor, imagemURL);
            break;
        case 'caminhao':
            garagem.caminhao = new Caminhao(modelo, cor, capacidadeCarga, imagemURL);
            break;
        default:
            showAlert("Selecione um tipo de veículo primeiro!");
            return;
    }
    updateInfoVeiculo();
}

// Interaction function
document.querySelectorAll("#acoes-veiculo button").forEach(button => {
    button.addEventListener("click", function () {
        const acao = this.dataset.acao;
        let veiculo = null;

        switch (veiculoSelecionado) {
            case 'carro':
                veiculo = garagem.carro;
                break;
            case 'esportivo':
                veiculo = garagem.esportivo;
                break;
            case 'caminhao':
                veiculo = garagem.caminhao;
                break;
            default:
                showAlert("Selecione um tipo de veículo primeiro!");
                return;
        }

        if (!veiculo) {
            showAlert("Crie um veículo primeiro!");
            return;
        }

        switch (acao) {
            case 'ligar':
                veiculo.ligar();
                break;
            case 'desligar':
                veiculo.desligar();
                break;
            case 'acelerar':
                veiculo.acelerar(10);
                break;
            case 'frear':
                veiculo.frear(5);
                break;
            case 'buzinar':
                veiculo.buzinar();
                break;
            case 'ativarTurbo':
                if (veiculo instanceof CarroEsportivo) {
                    veiculo.ativarTurbo();
                } else {
                    showAlert("Apenas carros esportivos podem ativar o turbo.");
                }
                break;
            case 'desativarTurbo':
                if (veiculo instanceof CarroEsportivo) {
                    veiculo.desativarTurbo();
                } else {
                    showAlert("Apenas carros esportivos podem desativar o turbo.");
                }
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                    const quantidade = parseInt(prompt("Quantidade para carregar:"));
                    if (!isNaN(quantidade)) {
                        veiculo.carregar(quantidade);
                    } else {
                        showAlert("Por favor, insira uma quantidade válida.");
                    }
                } else {
                    showAlert("Apenas caminhões podem ser carregados.");
                }
                break;
            case 'descarregar':
                if (veiculo instanceof Caminhao) {
                    const quantidade = parseInt(prompt("Quantidade para descarregar:"));
                    if (!isNaN(quantidade)) {
                        veiculo.descarregar(quantidade);
                    } else {
                        showAlert("Por favor, insira uma quantidade válida.");
                    }
                } else {
                    showAlert("Apenas caminhões podem ser descarregados.");
                }
                break;
        }

        updateInfoVeiculo();
    });
});

// Update display function
function updateInfoVeiculo() {
    const infoDiv = document.getElementById("informacoesVeiculo");
    const imagemExibida = document.getElementById("imagemExibida");
    let veiculo = null;

    switch (veiculoSelecionado) {
        case 'carro':
            veiculo = garagem.carro;
            break;
        case 'esportivo':
            veiculo = garagem.esportivo;
            break;
        case 'caminhao':
            veiculo = garagem.caminhao;
            break;
    }

    if (veiculo) {
        infoDiv.textContent = veiculo.exibirInformacoes();
        if (veiculo.imagem) {
            imagemExibida.src = veiculo.imagem;
            imagemExibida.style.display = 'block';
        } else {
            imagemExibida.style.display = 'none';
        }
        updateVelocidadeDisplay(veiculo.velocidade, veiculo.velocidadeMaxima);
        updateStatusVeiculo(veiculo.ligado);
    } else {
        infoDiv.textContent = "Nenhum veículo criado ou selecionado.";
        imagemExibida.style.display = 'none';
        updateVelocidadeDisplay(0, 100);
        updateStatusVeiculo(false);
    }
}