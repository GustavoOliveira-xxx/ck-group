# Marca CK

Fonte de tudo que é visual na marca da CK (Conscious Knowledge): a logo oficial, a vinheta de abertura e os arquivos que os apps usam.

**Slogan:** Consciência que cria, Conhecimento que transforma.

A CK tem **uma identidade só**: a máscara roxa e dourada. O alter ego (a logo verde) não aparece mais no site nem nos apps; fica só para as atividades internas da escola.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `ck-logo-original.svg` | Logo oficial como foi enviada (vetorizada). |
| `ck-logo.svg` | Logo oficial polida: curvas suavizadas e ruído do vetorizador removido. É a que o site usa (`midia/ck-logo.svg`). |
| `polir_logo.py` | Gera `ck-logo.svg` e `camadas.json` a partir do original. |
| `camadas.json` | A logo separada em camadas (raios, exclamações, máscara, olhos, brilho) para animar. |
| `vinheta.modelo.js` | Código da vinheta de abertura (versão Aurora). |
| `gerar_vinheta.py` | Junta camadas, letras e código e gera os dois arquivos abaixo. |
| `ck-vinheta.js` | Vinheta pronta para os apps web (um arquivo só, sem dependências). |
| `vinheta-dados.json` | Os mesmos desenhos, para o SynCK (React Native). |
| `russo.woff`, `grotesk.woff` | Russo One (CK e CONSCIOUS KNOWLEDGE) e Space Grotesk 600 (slogan). Licença SIL Open Font License. O texto vira curva no gerador, então os apps não precisam das fontes. |

## Mudar a vinheta

```bash
pip install fonttools shapely
python3 polir_logo.py      # só se a logo mudar
python3 gerar_vinheta.py
```

Depois copie:

- `ck-vinheta.js` para a raiz do site da CK, do FinCK, do DynamiCK e do AutoniCK;
- `vinheta-dados.json` para `synck-app/app-mobile/src/components/brand/vinheta/dados.json`.

## Como a vinheta funciona nos apps

- No `<head>`, logo depois da meta `viewport` e antes dos outros scripts: `<script src="ck-vinheta.js"></script>`.
- **Completa** (cerca de 4 s) na primeira abertura do dia; **curta** (cerca de 1,5 s, com a piscadinha) nas outras aberturas do dia; nada ao trocar de página na mesma sessão.
- Mostra "UMA PRODUÇÃO DE" antes da marca. No site da própria CK use `data-credito="nao"`.
- Um toque, clique ou tecla pula. Com "reduzir movimento" ligado, a marca só aparece suavemente.
- Desempenho: cada parte é uma camada pequena animada só com transformação e opacidade (trabalho da placa de vídeo). Os raios de luz do fundo são desenhados numa tela 4x menor e esticados. Se os primeiros quadros vierem lentos, a vinheta desliga sozinha os efeitos de fundo.
- `window.CKVinheta.tocar()` toca de novo (o botão "Assistir à vinheta" do site usa isso). Ao terminar, dispara o evento `ck:vinheta-fim`.
