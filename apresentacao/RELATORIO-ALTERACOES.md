# Relatório de alterações da apresentação FinCK

Data: 9 de novembro de 2026. Escopo autorizado: somente a pasta `apresentacao/` do repositório `ck-group`. A documentação ABNT foi declarada pronta pelo grupo e não fez parte desta etapa.

## Arquivos

| Arquivo | Situação | O que mudou |
|---|---|---|
| `index.html` | Modificado | Itens 02 a 12 reescritos com a base estatística definida; capa, item 01 e agradecimento ajustados; notas do apresentador; referências |
| `banca.css` | Modificado | Componentes novos ao final do arquivo (seção “Versão final · novembro de 2026”); nenhuma regra antiga removida |
| `ROTEIRO-GRUPO.md` | Reescrito | Roteiro de 8 minutos com fala, mensagem, destaque, o que apontar, transição e perguntas por item, mais as respostas para a banca |
| `roteiro-finck-8-minutos.pdf` | Regerado | Mesmo conteúdo do roteiro em A4, 9 páginas |
| `VALIDACAO-DADOS.md` | Atualizado | Registro das fontes (valor, fonte, período, público e ressalvas), dados de demonstração e capturas; revisão de outubro mantida como histórico |
| `RELATORIO-ALTERACOES.md` | Novo | Este relatório |
| `img/home-desktop.jpg`, `img/home-mobile.jpg`, `img/atencao.jpg`, `img/decisoes-desktop.jpg` | Novos | Capturas reais do modo de demonstração |

Não foram alterados `apresentacao.css`, `apresentacao.js`, `evidencias/`, as capturas antigas, o site institucional, os logotipos ou qualquer arquivo fora de `apresentacao/`.

## Slides

A apresentação continua com 14 telas: capa, 12 itens e agradecimento. Os atalhos, o cronômetro, as notas, o mapa, as referências, a ampliação das capturas, a tela cheia e o modo de celular foram preservados.

| Tela | Item | Antes | Agora |
|---|---|---|---|
| 1 | Capa | “Apresentação de defesa” | “Projeto Interdisciplinar · 2026”; grupo Conscious Knowledge · 2º C na ficha da capa |
| 2 | 01 | Tema, problema e hipóteses | Introdução, tema e objetivo; nota sobre a ODS 12 |
| 3 | 02 | CNC de julho (82,0%) e setembro; barras por renda e cartão | CNC de outubro: 81,6% endividadas e 29,3% em atraso; série jul./set./out. em escala 0–100%; quadro com os dois conceitos |
| 4 | 03 | Curva de juros sem teto e inadimplência (Serasa, CNDL, BCB) | Regra do Banco Central: R$ 1.000 → até R$ 2.000, com o alcance da regra; ligação com a simulação do FinCK. A curva ficou só nas notas, identificada como simulação |
| 5 | 04 | ANBIMA com 47% de estresse; Serasa/Opinion Box; YOUPIX | PISA 45,1%; Febraban 55% e 91%; score 500 × 542; fontes 18% × 15%; ANBIMA 33%, 24% e 36%; ressalva sobre pesquisas diferentes |
| 6 | 05 | Ranking e três cartões | Três cartões com selo de natureza do dado (estimativa, documentado, projeção); ranking de 2022; meta 12.5 |
| 7 | 06 | “Maior densidade do Brasil”; urbanização da prefeitura | Somente dados do IBGE; exemplo de uso em quatro passos; ressalva sobre densidade |
| 8 | 07 | Fundamentação (slide inteiro) | Fundamentação e metodologia no mesmo slide; Thoreau como inspiração; conta de 40 h 14 min; etapas com os testes de 28/10/2026 |
| 9 | 08 | Metodologia | Novo: Conhecendo o FinCK, com captura da home no computador e no celular e as três frentes |
| 10 | 09 | FinCK of Reality com três telas | Quatro telas (compra, impacto, metas e meses, decisão); valor, tempo, orçamento, metas, projeção e decisão |
| 11 | 10 | Hábitos, Revisão e Decisões | Hábitos e Revisão (mesma sessão de captura); projeção identificada; Espelho e Índice |
| 12 | 11 | Arquitetura e IA | ODS 12 (metas 12.5 e 12.8), Decisões conscientes, durabilidade, reparo, descarte e IA opcional |
| 13 | 12 | Interdisciplinaridade | Resultados e conclusão: entregas, testes, aplicabilidade local, interdisciplinaridade, limitações, próximos passos e frase de conclusão |
| 14 | — | Agradecimento | Mantido, com os seis nomes e a frase “O futuro também se constrói nas escolhas de hoje.” |

A arquitetura e a relação detalhada com as disciplinas passaram para as notas de apoio dos itens 11 e 12.

## Dados atualizados

- CNC: 81,6% e 29,3% em outubro de 2026, com julho (82,0%) e setembro (81,7% e 29,6%).
- Banco Central: teto de 100% do principal para rotativo e parcelamento do saldo da fatura, operações desde 3/1/2024; exemplo R$ 1.000 → R$ 2.000.
- OCDE: 416 pontos, 45,1% abaixo do nível 2, 18º de 20 por ordenação.
- Febraban/IPESPE: 55%, 91%, 18% (redes sociais) e 15% (escola ou universidade), do conjunto dos 3.000 entrevistados.
- Serasa: 542 e 500, abril de 2026; +49% em negociações nas notas.
- ANBIMA/Datafolha: 33%, 24% e 36%; o índice de 47% saiu.
- ITU/UNITAR: 62 milhões de t, 22,3% e 82 milhões de t (projeção).
- IBGE: 273.542 habitantes, 13.416,81 hab./km² (2022) e 20,371 km² (2025).
- ODS 12: metas 12.5 e 12.8.
- Testes: 972 aprovados na execução de 28/10/2026.

O detalhamento com períodos, públicos e ressalvas está em [VALIDACAO-DADOS.md](VALIDACAO-DADOS.md).

## Capturas

Quatro capturas novas, feitas em 9/11/2026 no modo de demonstração (detalhes em VALIDACAO-DADOS.md). O endereço publicado do FinCK estava bloqueado pela rede do ambiente de edição; por isso, as telas foram geradas a partir de uma cópia somente leitura do commit mais recente do `finck-app`, servida localmente, sem alterar nenhum arquivo e sem conexão com Supabase, IA ou mapas. Somente recortes foram aplicados; nenhum número foi alterado.

## Ajustes visuais

- Selos de natureza do dado (estimativa, projeção, documentado, dado da demo).
- Gráficos com escala explícita (0–100% e R$ 0–2.000) e barras mais grossas no item 04.
- Teto legal em barras empilhadas, no lugar da curva alarmista.
- Vitrine com computador e celular no item 08; captura em paisagem no item 11.
- Passos numerados no exemplo local; quadro de entregas com marcas de verificação.
- Ajuste automático de densidade: todos os slides ficam entre 0,91 e 1,00, sem transbordo.
- Modo de celular conferido nos slides novos, sem rolagem lateral.

## Testes realizados

| Teste | Resultado |
|---|---|
| 14 slides carregam, sem erro de JavaScript e sem recurso 404 | Aprovado |
| Transbordo de conteúdo no palco de 1280 × 720 | Nenhum; densidade mínima 0,91 |
| Setas, Home, End e teclas numéricas | Aprovado; mesmo comportamento da versão anterior |
| Notas (N), referências (R, 47 itens), mapa (O, 14 títulos), tela cheia (F) | Aprovado |
| Ampliação das quatro capturas novas | Aprovado; imagens carregadas |
| Largura de celular (390 px) nos slides 03, 04, 05, 09, 12 e 13 | Sem rolagem lateral |
| Roteiro × notas | Falas extraídas automaticamente das notas dos slides; fala-base de 7min30s |
| PDF do roteiro | 9 páginas A4, conferido visualmente |
| Contas | 3.500 ÷ 176 = 19,886…; 800 ÷ 19,886… = 40 h 14 min; 695,60 × 12 = 8.347,20; 800 ÷ 1.900 = 42%; 800 ÷ 2.146 = 37% |

Os testes usaram fontes locais do sistema, pois o Google Fonts também estava bloqueado no ambiente; no navegador com internet, as fontes da apresentação carregam normalmente. A versão publicada no GitHub Pages não pôde ser aberta deste ambiente: conferir após o push.

## Pendências

1. Definir os responsáveis pelos itens 03 a 12, pela capa e pelo agradecimento. Somente Gustavo Oliveira dos Santos está confirmado nos itens 01 e 02.
2. Ensaiar com cronômetro e ajustar as falas, se passar de 8 minutos.
3. Conferir se o documento ABNT usa os mesmos valores dos slides (matriz abaixo) e o dia exato de acesso às fontes novas; as referências da apresentação trazem “Acesso em: nov. 2026”.
4. Abrir a apresentação publicada depois do push e conferir as fontes e a tela cheia no computador da sala.

### Matriz de consistência para conferir no documento ABNT

| Tema | Valor na apresentação |
|---|---|
| ODS 12 | Metas 12.5 e 12.8 |
| Endividamento | CNC, outubro de 2026: 81,6% e 29,3% |
| PISA | 416 pontos e 45,1% |
| Febraban | 55%; 18% redes sociais e 15% escola ou universidade, do conjunto dos entrevistados |
| Serasa | 542 e 500, abril de 2026 |
| Resíduos | 62 mi t (2022), 22,3% (2022), 82 mi t (projeção 2030) |
| Taboão da Serra | 273.542; 13.416,81 hab./km² (2022); 20,371 km² (2025) |
| Testes | 972 (457 + 515), execução de 28/10/2026, commit 912b0c1 |
| IA | Opcional; panorama agregado na Revisão; foto ou link na importação de preço |
| Conclusão | Aplicação funcional; impacto educativo ainda não medido |

## Observações sobre o FinCK (sem intervenção)

Nenhum problema do aplicativo foi identificado que precise de registro. Duas notas de contexto:

- Os dados do modo de demonstração mudam com a data em que o app é aberto (por exemplo, a projeção do parcelamento e o Índice da home). Isso explica a troca do “−R$ 14,57” antigo pela projeção de 9/11/2026 no item 09.
- A estimativa de juros exibida no Reality vem de uma configuração do próprio app que prevê o teto legal de 100% (`TETO_JUROS_PCT`). Não foi feita auditoria desse cálculo.

## Declaração de integridade do escopo

Conferências feitas antes desta declaração: o `git status` do `ck-group` lista apenas arquivos dentro de `apresentacao/`; a cópia local do `finck-app` foi clonada somente para leitura, continua sem alterações (`git status` vazio no commit `67ba491`) e não recebeu commit nem push; nenhuma chamada foi feita ao Supabase, à Vercel ou às APIs de IA.

“O repositório finck-app, o aplicativo principal, o banco Supabase, as APIs, as configurações de produção e as funcionalidades do FinCK não foram alterados. As mudanças realizadas ficaram restritas à apresentação do projeto no CK Group e à documentação acadêmica.”

Observação: nesta etapa, a documentação acadêmica alterada foi a da pasta `apresentacao/` (roteiro, registro de fontes e este relatório). O documento ABNT não foi editado, porque o grupo informou que ele já está pronto.
