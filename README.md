# ARREDA A MÃO — Projeto modular (v5.4)

Reorganização **sem recompressão de sprites e sem mudanças intencionais na jogabilidade**. O código foi distribuído por responsabilidade, mantendo **uma única cena Phaser (`FightScene`)** e seus métodos de combate. As funções foram movidas mantendo o mesmo corpo original; a ligação por `Object.assign` é uma etapa intermediária deliberada para evitar reescrever toda a cena.

## Estrutura

```text
index.html                   — página, título, controles e mensagens
css/style.css                — estilo original
js/main.js                  — inicialização Phaser 3.90.0
js/assets/manifest.js       — 281 chaves e URLs de texturas
js/config/                  — parâmetros da arena, personagens e CPU
js/characters/              — parâmetros visuais e função da defesa do Junin
js/controllers/             — camada de comandos, entradas humanas e lógica CPU
js/combat/                  — movimento, ataques, rounds e especiais
js/scenes/FightScene.js     — ciclo de vida da cena e criação dos lutadores
js/scenes/visual.js         — desenho da arena e renderização das poses
js/ui/                     — menus, seleção e HUD
assets/characters/chila/    — imagens do Chila e do Churrasco
assets/characters/junin/    — imagens do Junin e do Jetta
assets/stages/              — cenário do Bar do Serjão
README.md                   — este documento
```

**Nota:** o protótipo anexado não continha arquivos de áudio Base64 para extrair. `assets/audio/` pode ser criada futuramente quando houver efeitos de áudio.

## Rodar localmente

Abra um terminal na pasta onde está o `index.html` e execute:

```bash
python -m http.server 8000
```

No navegador, acesse **http://localhost:8000/**. No Windows, `py -m http.server 8000` também funciona. **Não use duplo clique no `index.html`** (`file://`), pois os módulos JavaScript nativos precisam de servidor HTTP.

A versão **Phaser 3.90.0** continua vindo de `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`, **igual ao arquivo original**. A primeira execução requer conexão para obter o Phaser; os PNGs são locais. Não se adicionou npm, bundler ou outra engine.

## Controles

| Comando | P1 | P2 (multiplayer local) |
|---|---|---|
| Andar | A / D | ← / → |
| Pular | W | ↑ |
| Agachar | S | ↓ |
| Soco | F | K |
| Chute | G | L |
| Defender | H | O |
| Especial | **Q** | **P** |

Os dois especiais existentes são preservados: Chila Careca → **Churrasco do Avô do Chila**, Junin Hipotético → **Jetta Hipotético**. **Júlio ainda não possui especial** porque nenhuma spritesheet desse golpe foi fornecida. A CPU usa comandos internos, não a tecla P.

## Publicar no GitHub Pages

1. Descompacte o ZIP. Faça upload do conteúdo **da pasta do projeto**, inclusive `assets/`, `js/`, `css/`, `index.html` e `README.md`, para a raiz de seu repositório.
2. No GitHub, acesse **Settings → Pages → Build and deployment** e selecione publicação via branch (`main`, pasta `/root`, se esse for o fluxo do projeto).
3. Abra `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`. Todos os caminhos começam da pasta da página e funcionam em subpastas. Lembre-se de publicar todos os PNGs junto com os módulos JS.

### Enviar com Git, se desejar

```bash
git add index.html css js assets README.md
git commit -m "Organizar HTML e extrair sprites do Arreda a Mão"
git push origin main
```

O Git faz upload dos arquivos separadamente, sem depender de um HTML gigante.

## Adicionar conteúdo posteriormente

- Novo personagem: dados em `js/config/characters.js`, frames em `assets/characters/NOME/`, chaves/URLs no `js/assets/manifest.js`; comportamentos e animações em `FightScene.js` e módulos de combate/renderização quando necessário.
- Novos sprites de caminhada, chute, defesa: arquivos PNG em `assets/characters/...` e entradas no manifesto; mantenha escala e origens conforme lógica existente.
- Novos efeitos sonoros: futuramente criar `assets/audio/`, incluir chaves em `loadAssets` (usando `scene.load.audio`) e consumir na cena.
- CPU: dificuldades em `js/config/difficulties.js`; controle em `js/controllers/input.js`.
- Especial do Chila e Jetta: `js/combat/specials.js`.

## Integridade e tamanhos

- HTML de origem: **26,708,209 bytes** (25.47 MiB).
- Imagens declaradas no HTML: **281** (todas `image/png`).
- Arquivos PNG exclusivos: **281**.
- Duplicatas idênticas eliminadas: **0** (nenhuma detectada; não tentamos identificar imagens visualmente semelhantes).
- Soma dos PNGs extraídos: **19,970,230 bytes** (19.05 MiB).
- Novo `index.html`: **1,239 bytes**.

**Tamanho em disco não equivale à transferência real nem ao consumo de memória:** o original usava Base64 (com aumento de tamanho textual), e os PNGs extraídos agora podem ser armazenados em cache pelo navegador. Ao decodificar os sprites, o Phaser ainda ocupa memória conforme a resolução de cada textura. A transferência da engine Phaser via CDN é externa a essas medidas; compressão HTTP e cache variam de acordo com hospedagem e navegador.

## Limites de validação

O código foi extraído e seus módulos passaram por verificações de sintaxe, integridade de bytes, carregamento de manifesto e URLs locais. O navegador automatizado, quando disponível, deve ser usado para verificação visual. **A CDN Phaser pode não estar acessível em ambientes sem acesso à internet.** Confirme manualmente os menus, P1/P2, CPU nas 3 dificuldades, personagens iguais, transições, golpes, defesas, hit reaction, especiais Q/P e rounds antes de atualizar a versão pública.

### Verificações executadas nesta entrega

- **281/281** PNGs decodificados, validados e comparados por SHA-256 com os bytes dos Base64 originais.
- **299/299** URLs locais solicitadas por HTTP responderam **200 OK** (281 imagens + HTML, CSS e módulos JS).
- Arquivos JavaScript aprovados em `node --check`; módulos importados e `FightScene` instanciada com ambiente Phaser simulado.
- O método `preload()` registrou as **281 chaves originais**; nenhuma chave foi renomeada.
- Smoke test com ambiente simulado: menu inicial, seleção Single Player, inicialização das quatro combinações de personagens em Multiplayer Local e inicialização das três dificuldades de CPU.
- Smoke test de comandos: tecla **Q** para P1, **P** para P2, pulso único de comando e CPU isolada de P; especial do Chila/Junin selecionado por `characterId`.
- ZIP íntegro (`ZipFile.testzip()`).

**Não testado no navegador com Phaser real:** animações, efeitos sonoros, colisões, acertos e transições visuais durante uma partida completa. A dependência CDN do Phaser não estava disponível para o navegador nesta execução. Execute uma partida manual completa antes de substituir o site público.


## Vinheta inicial — Jogador do Equinócio (v5.1)

A vinheta carrega **uma vez por carregamento da página**, antes de `FightScene`, usando
`js/scenes/IntroScene.js`. Ela mostra o logo em preto com pixel art e inicia o menu ao
terminar. **Enter, Espaço e clique/toque** pulam a apresentação, sem confirmar o menu
seguinte. Revanche, saída da luta e retorno ao menu não reiniciam a apresentação.

**Observação sobre a imagem recebida:** o PNG fornecido possuía apenas o logo completo
(1254×1254 px). Não era a spritesheet 6×4 de 24 quadros descrita no pedido.
Para entregar a abertura sem inventar detalhes gráficos, derivamos os 24 quadros
*exclusivamente por revelação dos pixels do logo original*: lua (4 quadros), sol (8),
símbolo (3), letras (7) e logo completo (2). As durações respeitam os intervalos
solicitados, seguidas de 1 segundo de espera e 0,5 segundo de fade-out.
A imagem original permanece intocada em `assets/ui/jogador_do_equinocio_logo_original.png`;
a grade 6×4 (quadros 600×600, redimensionados com vizinho mais próximo para o atlas
caber em GPUs comuns) está em `assets/ui/jogador_do_equinocio_intro_24.png`.
Portanto a sequência é uma **revelação fiel baseada na arte original**, não a animação
original de 24 desenhos independentes que ainda não foi fornecida.

Arquivos novos:
- `js/scenes/IntroScene.js` — cena, temporizações, skip e limpeza de eventos.
- `assets/ui/jogador_do_equinocio_intro_24.png` — 24 quadros em grade 6×4.
- `assets/ui/jogador_do_equinocio_logo_original.png` — cópia byte a byte da referência.
- `assets/ui/jogador_do_equinocio_preview.png` — prévia 6×4.

Arquivos ajustados: `js/main.js` (inicializa IntroScene primeiro),
`js/scenes/FightScene.js` (proteção contra Enter/Espaço reaproveitados no menu) e
`css/style.css` (oculta cabeçalho e comandos durante a vinheta).
Se faltar o PNG da grade, a cena pula automaticamente para a tela original do jogo.
Não foram alterados personagens, especial, controles de combate, CPU, menus ou golpes.


## Nova tela inicial arcade (v5.2)

O fluxo desta versão é **IntroScene (vinheta do Jogador do Equinócio) → TitleScene
(título com animação) → FightScene (menu principal já existente)**. A tela de título
é exibida **uma única vez ao carregar a página**, não quando o jogador retorna ao
menu ao terminar uma luta.

**Novos arquivos:**

- `js/scenes/TitleScene.js` — cena da capa: cenário, quedas sequenciais dos logos,
  tremida de impacto, pergunta piscando, entradas de teclado/clique/toque,
  bloqueio contra avanço duplicado e liberação dos listeners/timers ao sair.
- `assets/ui/fundo_menu.png` — cenário noturno 1920×1080, exibido em 16:9.
- `assets/ui/logo_arreda.png` e `assets/ui/logo_a_mao.png` — logos originais
  sem alterações; escala uniforme de 0,48 na resolução lógica 960×540.
- `assets/ui/tem_coragem.png` — pergunta original, exibida após a queda do título.
- `assets/ui/toque_para_comecar.png` — instrução gráfica somente para telas de toque.

O arquivo `pressione_enter.png` **não foi copiado nem utilizado**. Para teclado,
`APERTE QUALQUER TECLA` é renderizado pelo Phaser com uma fonte monoespaçada
estilo arcade, texto prateado e contorno escuro.

A sequência dura **500 ms** (entrada do fundo) + **600 ms** (queda de ARREDA) +
**400 ms** (queda de A MÃO), seguidos de uma breve tremida. Após a chegada do
logo, a pergunta alterna a visibilidade a cada **700 ms** e a tela aguarda uma
nova tecla, clique ou toque; não passa automaticamente ao menu.
O comando de início faz um fade para preto de **300 ms**. Combinações com
Ctrl/Alt/Meta, teclas modificadoras isoladas, Tab, teclas de função e repetições
automáticas por tecla mantida são ignoradas. A próxima cena bloqueia confirmações
por **650 ms** para não escolher opções do menu com o mesmo comando.

**Arquivos existentes com mudanças limitadas:**
`js/main.js` (registra `TitleScene`), `js/scenes/IntroScene.js` (segue para
`TitleScene` em vez de `FightScene`), `css/style.css` (esconde cabeçalho e
controles externos enquanto a capa aparece) e `index.html` (título da aba).
Nenhuma lógica de personagens, especiais, HUD, IA, física ou rounds foi alterada.

### Como testar a abertura

1. Use `python -m http.server 8000` na raiz do projeto e abra `http://localhost:8000`.
   É preciso conexão à internet para carregar Phaser 3.90.0 via CDN.
2. Confirme a vinheta da produtora, depois a rua ao anoitecer, as duas quedas
   do logo e a pergunta piscante. Aguardar não pode abrir o menu automaticamente.
3. Recarregue a página, pule a vinheta segurando Enter ou Espaço e confirme
   que isso não pula também a capa. Solte a tecla e aperte outra vez **depois
   que o título terminar de cair** para abrir o menu de modos.
4. Teste clique e toque, assim como um navegador móvel (mostra o PNG
   `TOQUE PARA COMEÇAR` em vez do texto de teclado).
5. Confirme a seleção de personagens, Single Player, Multiplayer Local,
   golpes normais, especiais **Q/P**, rounds e revanche. Volte ao menu da luta:
   não deve reaparecer nem a vinheta nem a nova tela de início.

### Limitação de testes

A sintaxe dos módulos, o inventário de arquivos, os caminhos HTTP e o fluxo
de transições da `TitleScene` foram verificados automaticamente por simulação.
Quando Phaser via CDN não puder ser carregado no ambiente de testes, a animação
real no navegador, responsividade móvel e partidas completas devem ser validadas
manualmente antes da publicação pública.


## v5.3 — Júlio Mente Pensante (novo lutador jogável)

O elenco agora tem três personagens: **Chila Careca**, **Junin Hipotético** e
**Júlio Mente Pensante** (`characterId: julio-mente-pensante`).
A tela de seleção usa a lista `CHARACTER_ORDER` de `js/config/characters.js`:
é possível escolher Júlio no **P1, P2 ou CPU**, inclusive Júlio contra Júlio.

### Assets e animação
- `assets/characters/julio/julio_idle_0.png` a `julio_idle_7.png`: os **8 frames**
  recortados da spritesheet recebida, fundo originalmente transparente preservado;
  nunca foram recriados ou substituídos por imagens de outros lutadores.
- `js/characters/julio.js`: configuração da animação `julio-idle` (8 FPS,
  repetição contínua) e escala proporcional de 0,50; pés alinhados ao piso.
- `js/assets/manifest.js`: oito chaves novas para imagens externas.
- `PREVIA_JULIO_FIGHT_STANCE.png`: contato visual com fundo quadriculado.

### Movimentos provisórios
Com as spritesheets adicionais ainda indisponíveis, Júlio permanece visualmente
na animação original **Fight Stance** enquanto caminha, soca, chuta, salta,
agacha ou defende, **sem girar, esticar ou reutilizar sprites alheios**.
Todas essas ações usam os controles e o mesmo sistema lógico de física,
dano, colisão, bloqueio, rounds e CPU. **O especial de Júlio NÃO existe**:
Q/P não ativa nenhum especial para ele, e a CPU não tenta executá-lo.
Os especiais do Chila e Junin permanecem inalterados.

### Para adicionar animações futuras
Acrescente novos PNGs em `assets/characters/julio/`, registre as chaves
em `js/assets/manifest.js`, a animação em `FightScene.create()` e o estado visual
em `js/scenes/visual.js`. Os nomes previstos são `julio-walk`, `julio-punch`,
`julio-kick`, `julio-jump`, `julio-crouch`, `julio-block`, `julio-hit` e
`julio-special`, mas **nenhum deles está carregado** até existirem arquivos.

Para executar: `python -m http.server 8000` na pasta extraída, depois
acesse `http://localhost:8000`. Para publicar, envie todo o conteúdo da pasta
para o repositório do GitHub Pages; não tente subir só o `index.html`.


## v5.4 — Padronização 1920 × 1080 (16:9)

**Canvas lógico do Phaser: 1920 × 1080 em TODAS as cenas.**
O cenário inicial mantém a composição da versão aprovada, incluindo os PNGs originais,
as animações e o posicionamento das duas metades do título.

### Estratégia: apresentação por câmera, sem alterar a simulação

A v5.3 usa posições/colisões em uma área virtual de **960 × 540**, com chão
em `y = 440`. Em vez de multiplicar centenas de posições e velocidades por
2 (e correr o risco de alterar o combate), a v5.4 mantém **as mesmas unidades
internas** e faz a única conversão espacial na câmera de cada cena:

| Dimensão | Referência atual |
|---|---|
| Resolução lógica do canvas | 1920 × 1080 |
| Mundo original das cenas / luta | 960 × 540 |
| Zoom uniforme da câmera | 2 × |
| Mundo visível na câmera | X: 0–960; Y: 0–540 |
| Chão do combate | y = 440 no mundo (= 880 px no canvas) |
| Posições iniciais (P1 e P2) | x = 270 / 690 no mundo |
| Proporção da área de jogo | 16:9 |

O Phaser converte automaticamente os cliques para as coordenadas de mundo
por meio da câmera. **Não multiplicar por dois** posições físicas, gravidade,
velocidade, hitboxes, alcance, projéteis, distâncias da CPU ou escalas individuais
dos lutadores: isso produziria uma dupla ampliação. Todos os tempos de combate,
vida, dano, hit stun e cooldowns foram mantidos.

Arquivos da resolução e do enquadramento:
- `js/config/game.js`: tamanho 1920×1080, dimensões do mundo e zoom único.
- `js/config/layout.js`: câmera reutilizável e pontos de referência para menu, HUD e palco.
- `js/main.js`: Phaser 3.90.0 em `FIT` / `CENTER_BOTH`, atualiza após tela cheia.
- `js/scenes/IntroScene.js`, `TitleScene.js`, `FightScene.js`: a mesma configuração
  de câmera aplicada ao entrar em cada cena.
- `js/ui/menu.js` e `js/ui/hud.js`: pontos de ancoragem do layout centralizados.
- `js/scenes/visual.js`: ajusta **somente** o enquadramento do fundo do Bar do Serjão.
- `css/style.css`: tela cheia no navegador, sem scrollbar, com barras pretas
  automáticas quando a janela não for 16:9; pixel art sem suavização.
- `tests/verificar_layout.mjs` e `tests/verificar_menus.mjs`: verificações estruturais.

### Limitação preexistente da arena

A arte original do Bar do Serjão é **1536×1024 (3:2)**, portanto não cabe em 16:9
sem recorte, barras laterais ou distorção. O protótipo anterior a **esticava**
para 960×540. Nesta versão ela usa o mesmo fator de escala nos dois eixos,
preenchendo a largura, com enquadramento vertical `topOffset = -30` no mundo.
São cortados aproximadamente 48 pixels na parte superior e 112 na inferior
*da imagem original*, mantendo o letreiro e a zona central do piso.
Os pixels e arquivos originais não foram alterados; não há estiramento dos lutadores.

A vinheta e o cenário da rua são 16:9 na apresentação. O canvas fixo
1920×1080 é adaptado pelo Phaser a tamanhos de janela diferentes; telas em
retrato ficam com barras pretas significativas. Para jogar em celular, o modo
paisagem melhora a legibilidade; o jogo continua com controles de teclado para
a luta, pois não foram acrescentados controles de toque nesta tarefa.

### Verificações executadas na v5.4

- `node --check` em todos os módulos JavaScript.
- `node tests/verificar_layout.mjs`: **915 testes** de geometria, zoom,
  inversão de coordenadas para cliques, FIT 16:9, assets e constantes do mundo.
- `node tests/verificar_menus.mjs`: **198 testes simulados** de modo local,
  Single Player, seleções de três lutadores (inclusive iguais), dificuldade,
  resultado e revanche.
- CSS de tela cheia conferido com Chromium headless em 1920×1080, 1366×768,
  1024×768, 390×844 e 844×390: sem barras de rolagem, sem deformação e com
  canvas centralizado. Este é um teste de responsividade com canvas de simulação,
  **não** uma execução de Phaser.
- Hashes de arquivos comparados com o ZIP original v5.3: os assets e os
  módulos de mecânica/comandos/CPU permanecem exatamente os mesmos.
- A integridade ZIP é verificada ao gerar o pacote.

**Ainda não testado com o Phaser real no Chromium neste ambiente:** animações
em tempo real, áreas clicáveis no renderizador, colisões e efeitos em uma partida
completa. A CDN Phaser 3.90.0 não pôde ser alcançada. Validar manualmente nos
navegadores de destino antes de publicar. Isso também vale para os efeitos de
shake e as transições da abertura.

### Como testar esta versão

Na raiz descompactada do projeto:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000/` e confira intro → capa → menu → seleção →
combate. Teste Chila, Junin e Júlio em ambos os slots e como CPU; especial
**Churrasco Q/P**, especial **Jetta Q/P**, rounds, revanche e retorno ao menu.
Redimensione a janela e use F11 (tela cheia do navegador) para conferir as
barras pretas. Se tiver Node.js instalado, rode os dois comandos de teste acima.

No GitHub Pages, envie **todas as pastas** para a raiz do repositório. Não
publique apenas o HTML: as imagens seguem como PNGs externos e os caminhos são
relativos. Os arquivos de arte originais foram preservados.
