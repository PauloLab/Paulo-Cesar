// ===== 1. Estrelas interativas (canvas) =====
// Diferente da versão anterior (divs paradas), aqui cada estrela é um
// ponto recalculado a cada quadro. Isso permite reagir ao mouse e
// desenhar linhas entre estrelas próximas.

const canvas = document.getElementById("estrelas");
const ctx = canvas.getContext("2d");

let largura, altura;
function ajustarTamanho() {
    largura = canvas.width = window.innerWidth;
    altura = canvas.height = window.innerHeight;
}
ajustarTamanho();
window.addEventListener("resize", ajustarTamanho);

// Posição do mouse. Começa bem longe da tela, pra nenhuma estrela
// reagir antes da pessoa mexer o cursor.
const mouse = { x: -9999, y: -9999 };
window.addEventListener("mousemove", (evento) => {
    mouse.x = evento.clientX;
    mouse.y = evento.clientY;
});
// No celular não existe "mouse passando por cima", então escondemos
// o cursor ao tocar na tela pra interação não ficar "grudada" num ponto.
window.addEventListener("touchend", () => {
    mouse.x = -9999;
    mouse.y = -9999;
});

const RAIO_INFLUENCIA = 130;   // distância (em pixels) em que o mouse afeta as estrelas
const FORCA_REPULSAO = 1.8;    // quão forte a estrela foge do cursor
const DISTANCIA_LINHA = 110;   // distância máxima pra desenhar uma linha entre duas estrelas

class Estrela {
    constructor() {
        this.origemX = Math.random() * largura;
        this.origemY = Math.random() * altura;
        this.x = this.origemX;
        this.y = this.origemY;
        this.raio = Math.random() * 1.5 + 0.6;
        this.velX = (Math.random() - 0.5) * 0.15; // deslocamento natural, bem lento
        this.velY = (Math.random() - 0.5) * 0.15;
        this.fasePiscar = Math.random() * Math.PI * 2;
    }

    atualizar(tempo) {
        // Deslocamento natural, flutuando devagar pela tela
        this.origemX += this.velX;
        this.origemY += this.velY;

        // Se sair da tela, reaparece do outro lado
        if (this.origemX < 0) this.origemX = largura;
        if (this.origemX > largura) this.origemX = 0;
        if (this.origemY < 0) this.origemY = altura;
        if (this.origemY > altura) this.origemY = 0;

        // Distância até o mouse
        const dx = this.origemX - mouse.x;
        const dy = this.origemY - mouse.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < RAIO_INFLUENCIA) {
            // Quanto mais perto do mouse, mais forte o empurrão pra longe
            const forca = (RAIO_INFLUENCIA - distancia) / RAIO_INFLUENCIA;
            this.x = this.origemX + (dx / distancia) * forca * RAIO_INFLUENCIA * (FORCA_REPULSAO - 1);
            this.y = this.origemY + (dy / distancia) * forca * RAIO_INFLUENCIA * (FORCA_REPULSAO - 1);
        } else {
            // Longe do mouse, a estrela volta suavemente pra posição natural
            this.x += (this.origemX - this.x) * 0.08;
            this.y += (this.origemY - this.y) * 0.08;
        }

        // Brilho oscilando (efeito de piscar), usando seno pra ir e voltar
        this.opacidade = 0.3 + Math.sin(tempo * 0.0015 + this.fasePiscar) * 0.3 + 0.3;
    }

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 217, 179, ${this.opacidade})`;
        ctx.fill();
    }
}

const quantidadeEstrelas = Math.min(120, Math.floor((largura * altura) / 12000));
const estrelas = Array.from({ length: quantidadeEstrelas }, () => new Estrela());

function animar(tempo) {
    ctx.clearRect(0, 0, largura, altura);

    estrelas.forEach(estrela => {
        estrela.atualizar(tempo);
        estrela.desenhar();
    });

    // Linhas conectando estrelas próximas, criando o efeito "constelação"
    for (let i = 0; i < estrelas.length; i++) {
        for (let j = i + 1; j < estrelas.length; j++) {
            const dx = estrelas[i].x - estrelas[j].x;
            const dy = estrelas[i].y - estrelas[j].y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < DISTANCIA_LINHA) {
                ctx.beginPath();
                ctx.moveTo(estrelas[i].x, estrelas[i].y);
                ctx.lineTo(estrelas[j].x, estrelas[j].y);
                ctx.strokeStyle = `rgba(255, 107, 53, ${0.15 * (1 - distancia / DISTANCIA_LINHA)})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animar);
}
requestAnimationFrame(animar);


// ===== Vídeos de projeto: tocam ao passar o mouse, pausam ao sair =====
// preload="metadata" no HTML faz o navegador carregar só a capinha
// (duração, dimensões), sem baixar o vídeo inteiro de cara — ele só
// é realmente baixado quando a pessoa passa o mouse e o play() roda.
const videosProjeto = document.querySelectorAll(".thumb-video");

videosProjeto.forEach(video => {
    video.addEventListener("mouseenter", () => video.play());

    video.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0; // volta pro começo, pra próxima vez que passar o mouse começar do zero
    });
});


// ===== Modal de vídeo =====
// Em vez de abrir o vídeo em outra aba, interceptamos o clique no card
// (e.preventDefault() cancela a navegação do link) e tocamos o vídeo
// dentro de uma janela flutuante por cima da página.
const modal = document.getElementById("modal-video");
const modalPlayer = document.getElementById("modal-video-player");
const modalTitulo = document.getElementById("modal-titulo");
const modalFechar = document.getElementById("modal-fechar");

function abrirModal(card) {
    modalPlayer.src = card.dataset.video;
    modalTitulo.textContent = card.querySelector(".nome-projeto").textContent;
    modal.classList.add("ativo");
    modalPlayer.play();
}

function fecharModal() {
    modal.classList.remove("ativo");
    modalPlayer.pause();
    modalPlayer.removeAttribute("src"); // libera a memória do vídeo carregado
    modalPlayer.load();
}

// [data-video] seleciona só os cards que têm vídeo de verdade —
// os cards de projetos de código (sem esse atributo) continuam
// funcionando como links normais.
document.querySelectorAll(".card-projeto[data-video]").forEach(card => {
    card.addEventListener("click", (evento) => {
        evento.preventDefault();
        abrirModal(card);
    });
});

modalFechar.addEventListener("click", fecharModal);

// Clicar fora do vídeo (no fundo escuro) também fecha
modal.addEventListener("click", (evento) => {
    if (evento.target === modal) fecharModal();
});

// Tecla Esc fecha o modal
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharModal();
});


// ===== 2. Troca de idioma ===== (mesma lógica dos templates anteriores)
const botoesIdioma = document.querySelectorAll(".idioma-btn");
const elementosTraduziveis = document.querySelectorAll("[data-pt]");

botoesIdioma.forEach(botao => {
    botao.addEventListener("click", () => {
        const idioma = botao.dataset.lang;

        botoesIdioma.forEach(b => b.classList.remove("ativo"));
        botao.classList.add("ativo");

        elementosTraduziveis.forEach(el => {
            el.textContent = el.dataset[idioma];
        });
    });
});


// ===== 3. Terminal interativo =====
const entrada = document.getElementById("terminal-input");
const saida = document.getElementById("terminal-saida");

const comandos = {
    help: "comandos: help, sobre, skills, pokemon, projetos, contato, limpar",
    sobre: "estudante de programação, edição de vídeo e marketing.",
    skills: "HTML, CSS, JavaScript, edição de vídeo, marketing digital",
    pokemon: "Charizard — tipo Fogo/Voador, 1,7m, 90,5kg. #006 na Pokédex nacional.",
    projetos: "veja as seções 'PROJETOS DE EDIÇÃO' e 'PROJETOS DE CÓDIGO' logo abaixo",
    contato: "github, instagram, linkedin e tiktok estão na seção VAMOS CONVERSAR",
};

entrada.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;

    const texto = entrada.value.trim().toLowerCase();
    entrada.value = "";

    if (texto === "limpar") {
        saida.textContent = "";
        return;
    }

    const resposta = comandos[texto] || `comando não encontrado: ${texto}`;
    saida.textContent += `~$ ${texto}\n${resposta}\n\n`;
    saida.scrollTop = saida.scrollHeight;
});
