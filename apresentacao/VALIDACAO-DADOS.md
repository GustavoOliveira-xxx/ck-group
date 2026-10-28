# Revisão das evidências da apresentação FinCK

Revisão: 28 de outubro de 2026. Escopo: `apresentacao/index.html`, incluindo notas, legendas de ampliação, textos acessíveis e referências. A numeração abaixo é a impressa no cabeçalho; a capa ocupa a primeira posição na navegação.

## Critério de leitura

“Confirmado” significa que o dado foi localizado na fonte indicada, com seu recorte e referência temporal. Não significa certeza absoluta, ausência de erro amostral ou auditoria independente. Estimativas, projeções, autorrelatos e dados técnicos internos têm naturezas distintas.

## Correções solicitadas

| Tema | Tratamento final | Evidência |
|---|---|---|
| PISA, slide 04 | 18º entre 20 países e economias por ordenação das médias; 416 pontos; 45,1% abaixo do nível 2. Ressalva sobre significância estatística no rodapé e nas notas. | [OCDE, Volume IV, tabela IV.1 e tabelas associadas](https://www.oecd.org/en/publications/2024/06/pisa-2022-results-volume-iv_125a58b3/full-report/component-5.html). A posição resulta da ordenação, não de um teste de diferença entre vizinhos. |
| Rotativo, slide 03 | Curva explicitamente matemática, sem pagamentos, com taxa constante e sem teto legal; não é uma cobrança contratual admissível por oito meses. Teto de juros e encargos de 100% do principal desde 3/1/2024, nas operações abrangidas, incluindo parcelamento do saldo da fatura. | [Lei 14.690/2023, art. 28](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14690.htm), [explicação do BCB](https://www.bcb.gov.br/estatisticas/juros-cartao-de-credito). O Planalto bloqueou a leitura automatizada; a regra e a data foram confirmadas na publicação do BCB. |
| Taxa do rotativo | Agosto de 2026: 444,89% a.a., exibidos como 444,9%. | [BCB, SGS 22022, consulta de agosto de 2026](https://api.bcb.gov.br/dados/serie/bcdata.sgs.22022/dados?formato=json&dataInicial=01/08/2026&dataFinal=31/08/2026). Resposta consultada: `01/08/2026`, `444.89`. |
| Lixo eletrônico, slide 05 | 62 milhões de toneladas mundiais em 2022; projeção mundial de 82 milhões em 2030; 22,3% da massa mundial com coleta e reciclagem formalmente documentadas em 2022. | [ITU/UNITAR, Global E-waste Monitor 2024](https://www.itu.int/en/ITU-D/Environment/Pages/Publications/The-Global-E-waste-Monitor-2024.aspx), capítulo 3. |
| Pequenos gastos, slide 10 | Na demonstração, 26 gastos e R$ 695,60 em 30 dias. R$ 8.347,20 é projeção se repetido o ritmo mensal, não gasto anual observado. | Aritmética: R$ 695,60 × 12 = R$ 8.347,20. A quantidade e os valores de demonstração foram preservados como dados internos simulados. |
| Hipóteses e resultados | H1 e H2 continuam a validar com pessoas. Revisões de interface e testes determinísticos não demonstram confiança, compreensão, redução de consumo impulsivo ou de resíduos. | Limitação metodológica explicitada nos slides e notas. Não há resultados de testes com usuários apresentados. |

## Outras inconsistências e decisões

| Ponto encontrado | Decisão e justificativa |
|---|---|
| Gráfico ambiental sem ano e com China 10,0, Índia 3,2 e Japão 2,5 milhões de toneladas | Atualizado para uma base comum, 2022: China 12,1; EUA 7,2; Índia 4,1; Japão 2,6; Brasil 2,4 milhões de toneladas. O [anexo 2 da ITU/UNITAR](https://www.itu.int/en/ITU-D/Environment/Documents/Publications/2025/d-gen-e_waste.01-2024-pdf-e.pdf) registra, em milhões de kg, respectivamente 12066, 7188, 4137, 2638 e 2443. Barras proporcionais aos valores antes do arredondamento. |
| Taxa brasileira de 3% e estimativa de resíduos têxteis no mesmo slide | Cartões substituídos pelos três indicadores mundiais solicitados, com período e definição comuns. Não se declarou que os valores retirados eram falsos. O anexo da ITU contém informação brasileira própria, que não deve ser confundida com os 22,3% globais. A publicação têxtil citada não pôde ser consultada nesta revisão. |
| Sono, trabalho excessivo e conflitos familiares atribuídos à edição 2026 da ANBIMA | Os indicadores não foram localizados no relatório completo da 9ª edição. Substituídos por indicadores efetivamente presentes: 34% com gastos superiores à renda nos seis meses anteriores; 31% sem reserva para imprevistos; 29% com alguma dívida em atraso. Mantidos os 47% classificados com alto estresse. São dados de 2025, publicados em 2026. [Relatório, p. 52–58](https://www.anbima.com.br/data/files/BE/05/B0/55/1EABD91008E6DAD9F82BA2A8/Raio-X-do-Investidor-9-edicao.pdf). |
| Comparação 15% × 27% apresentada como informação sobre jovens | O [guia oficial da Febraban](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/febraban-guia%20de%20boas%20pr%C3%A1ticas-v7-web.pdf) informa 15% para ensino formal e 18% para redes sociais no total dos entrevistados. Corrigidos público e percentual. Mantidos 91% que reconhecem importância e 55% que entendem pouco ou nada, com referência ao Observatório de julho de 2025. |
| +49% da Serasa | Corrigido o objeto: número de pessoas de 18 a 25 anos que negociaram no Serasa Limpa Nome, janeiro a julho de 2025 comparado ao mesmo período de 2024. Não equivale a crescimento da inadimplência nem demonstra tendência contínua. [Fonte primária](https://www.serasa.com.br/imprensa/geracao-z-e-o-publico-que-mais-cresce-nas-negociacoes-de-dividas/). |
| Score 505 e média 548; divergência entre texto e imagens da página | Pendência resolvida na rechecagem: o PDF original de abril de 2025 confirma 548 na página 5 e 505 para 18–25 anos na página 7. Também foi consultado o PDF de abril de 2026, disponibilizado na [página oficial da Serasa](https://www.serasa.com.br/score/mapa-do-score/): 542 na página 5 e 500 para 18–25 anos na página 7. O cartão, as notas e a referência foram atualizados para abril de 2026. A conferência incluiu texto e renderização visual dos dois PDFs. As imagens divergentes da página de divulgação não foram usadas como evidência. |
| 19,4% de comprometimento superior à metade da renda, setembro de 2026 | Não localizado no comunicado primário consultado. Substituído por 19,0% de julho de 2026, explicitamente publicado pela [CNC em 6/8/2026](https://portaldocomercio.org.br/acoes-institucionais/cnc-endividamento-e-o-maior-da-serie-historica/). Não se declarou falso o número anterior. |
| Cartão como “principal dívida” de 85,3% | Corrigido para proporção dos endividados que citaram cartão entre as dívidas, julho de 2026. Não é proporção de todas as famílias nem uma pergunta exclusiva sobre a dívida principal. |
| “2,5 vezes maior” | Precisado como “2,5 vezes a proporção”, comparação aproximada de 38,5% com 15,1%, nas faixas de renda indicadas. |
| Serasa: meses e bases misturados | Separados agosto (83,98 milhões) e fevereiro de 2026 (81,7 milhões, crescimento em dez anos e renda). Os 48% com até um salário mínimo constam do estudo de dez anos vinculado ao [release da Serasa](https://www.serasa.com.br/imprensa/10-anos-do-mapa-de-inadimplencia/). |
| Renda e CadÚnico locais sustentados por compilação, sem conferência primária | Substituídos por área territorial de 20,371 km², referência 2025 do [IBGE](https://www.ibge.gov.br/cidades-e-estados/sp/taboao-da-serra.html), e urbanização de 100% em 2022, do [perfil oficial municipal](https://www.ts.sp.gov.br/portal/servicos/1010/perfil-de-taboao-da-serra). Preservados população e densidade do Censo 2022. Não recalcular densidade com área de outro ano. |
| Teoria apresentada como eficácia do recurso | Retiradas afirmações de que o custo em horas provoca deliberação ou pesa mais que preço monetário. Mantidas como hipóteses de desenho, sem confirmação no FinCK. Shefrin e Statman (1985) identificados pelo tema real, efeito disposição em investimentos. |
| “Equação de Thoreau” | Identificada como adaptação didática. A frase foi conferida em [Walden, capítulo Economy](https://www.gutenberg.org/files/205/205-h/205-h.htm). Substituída página específica por capítulo, pois a paginação depende da edição. A fórmula financeira não foi atribuída como equação publicada por Thoreau. |
| “Auditorias externas” e “H2 confirmada” | Substituídas por revisões técnicas internas e hipótese pendente de validação com usuários. |
| Contagem de 973 testes (458 no navegador + 515 em Node.js) | A reexecução de 28/10/2026, no commit 912b0c1 do FinCK, encontrou 457 casos no navegador e 515 verificações nos scripts Node.js, todos aprovados: soma de 972. Apresentação e notas corrigidas para essa execução identificada. A soma reúne casos de teste e verificações com granularidades diferentes; não mede cobertura, segurança em produção ou eficácia educativa. Não se concluiu que a contagem histórica de outra versão era falsa. |
| “63 políticas RLS” | O código usa criação dinâmica e substituição de políticas entre migrações, não apenas declarações individuais que possam ser somadas. A leitura não sustentou o total 63, e o banco publicado não foi consultado. Retirada a contagem, preservando a descrição de políticas para isolamento por usuário. Definir uma política no código não comprova sua implantação ou eficácia em produção. |
| IA recebe “só dados agregados” | Precisado o escopo: o panorama da Revisão é agregado; os recursos de extração recebem foto ou link. Não se estendeu a todas as rotas uma propriedade do panorama da Revisão. |

## Dados externos preservados

- CNC/Peic: 82,0% em julho/agosto e 81,7% em setembro de 2026; 29,6% com atraso em setembro; comparação por renda de julho e 18,3% sem condições de pagamento na faixa de menor renda em agosto. Conferência nos comunicados oficiais de [julho](https://portaldocomercio.org.br/acoes-institucionais/cnc-endividamento-e-o-maior-da-serie-historica/), [agosto](https://portaldocomercio.org.br/acoes-institucionais/cnc-mais-endividadas-do-que-a-media-familias-de-menor-renda-lideram-avanco-na-inadimplencia-em-agosto/) e [setembro](https://portaldocomercio.org.br/acoes-institucionais/cnc-inadimplencia-e-endividamento-das-familias-brasileiras-recuam-em-setembro/).
- CNDL/SPC: 75,05 milhões e 44,67% da população adulta em setembro de 2026, conforme [comunicado de 20/10/2026](https://cndl.org.br/varejosa/inadimplencia-volta-a-crescer-no-brasil-e-atinge-7505-milhoes-de-consumidores-em-setembro-aponta-cndl-e-spc-brasil/).
- BCB: comprometimento de renda de 28,7%, julho de 2026, conforme [nota de 29/9/2026](https://www.bcb.gov.br/content/estatisticas/hist_estatisticasmonetariascredito/202609_Texto_de_estatisticas_monetarias_e_de_credito.pdf).
- Serasa/Opinion Box: 46% e 54%, descritos como autorrelatos. [Release original da assessoria](https://saladeimprensa.trevocomunica.com/releases/46-dos-brasileiros-ja-realizaram-compras-por-impulso-para-se-sentirem-melhor-emocionalmente-revela-pesquisa-serasa/1008832): 1.240 entrevistas online, 8–19/8/2025; margem de erro informada de 2,8 pontos percentuais.
- YOUPIX/Nielsen: 80% já compraram algo indicado por influenciador, conforme [publicação das responsáveis pelo estudo em 2025](https://youpix.com.br/relevancia-pra-alem-do-hype-o-que-os-dados-dizem-sobre-influencia-e-consumo/). Não foi transformado em taxa de compras impulsivas.

## Limites e dados internos

Na primeira revisão foram preservados os números internos, sem reprodução da suíte. Na rechecagem de 28/10/2026, a suíte foi efetivamente executada na cópia local do commit `912b0c13abeb6b164cda79ad4617bf078d3865bb` do FinCK: 457 casos no navegador e 515 verificações nos oito scripts Node.js, sem falhas. A apresentação agora usa essa contagem observada, e não o total anterior de 973. O [registro da execução](evidencias/verificacao-local-2026-10-28.json) identifica versão, ambiente, scripts, quantidades e limites.

A leitura estática das migrações confirmou definições de 20 tabelas e 14 nomes de funções SQL em 13 arquivos. Isso descreve o código versionado, não o esquema efetivamente implantado. A contagem de políticas RLS foi retirada, pois não foi confirmada. Não foram usados dados reais, credenciais de usuário ou consultas ao banco de produção.

Rodadas de UX, distância até decisão, etapas, termos de IA, 1,2 s em verificação pontual, quatro correções, níveis, conquistas e regras de XP permanecem como registros ou características internas. Foram localizados os registros de UX em `docs/ux-sem-cara-de-ia.md` e o registro pontual de 1,2 s em `docs/criterios-de-entrega.md` do FinCK. A medição de latência de 15/10/2026 não foi reexecutada e não representa média, percentil ou garantia de desempenho. Nenhum desses registros foi denominado auditoria externa.

Valores nas capturas e na demonstração não representam um estudo de usuários. “Economia confirmada” é o nome de um registro baseado no relato posterior da pessoa, sem comprovação independente. Não há mensuração apresentada de redução de consumo impulsivo, confiança ou resíduos.

Os documentos internos da escola e os registros de desenvolvimento foram preservados como fontes internas; esta revisão não constitui autenticação desses documentos.

## Rechecagem do score e testes locais — 28/10/2026

### Relatórios originais da Serasa

- [Abril de 2025: PDF original ligado pelo blog da Serasa](https://cdn.builder.io/o/assets%2Fb212bb18f00a40869a6cd42f77cbeefc%2F238c18617229425bb8ba9eafed0ce0c9?alt=media&apiKey=b212bb18f00a40869a6cd42f77cbeefc&token=475dd68f-919b-4286-9868-4acfa40eb3da): 548 geral (p. 5), 505 para 18–25 anos (p. 7).
- [Abril de 2026: PDF original ligado na página oficial do Mapa Score](https://cdn.builder.io/o/assets%2Fb212bb18f00a40869a6cd42f77cbeefc%2F367df22cb3fe49ff9040988e2fdd48fe?alt=media&apiKey=b212bb18f00a40869a6cd42f77cbeefc&token=6543980c-bb06-4faf-b30e-4d52cc2c0bef): 542 geral (p. 5), 500 para 18–25 anos (p. 7). É o recorte usado na apresentação.
- O [comunicado oficial da Serasa de agosto de 2026](https://www.serasa.com.br/imprensa/primeiro-ano-mapa-score-brasil/) também informa os valores de 2026. A escolha das páginas do PDF evita misturar o histórico de 2025 com o recorte de 2026.
- SHA-256 dos arquivos consultados: 2025, `9226383cef2736d928f0a5b7034eb7fabfeef1a31ace94b03f74ef038a7bae2e`; 2026, `79bd2ca413192b46b3012374c7e3d42f9911ac1b25e7638f6711d9c35912143c`.

O score é uma pontuação de crédito. Não é uma avaliação isolada de educação financeira, não é o Índice FinCK e não comprova que jovens são mais inadimplentes. A menor média se refere às seis faixas apresentadas naquele relatório.

### Reprodução local das verificações técnicas

| Suíte | Aprovadas | Falhas |
|---|---:|---:|
| `testes.html`, no navegador | 457 | 0 |
| `node ferramentas/testar-assistente.mjs` | 131 | 0 |
| `node ferramentas/testar-ia.mjs` | 77 | 0 |
| `node ferramentas/testar-impacto.mjs` | 31 | 0 |
| `node ferramentas/testar-print.mjs` | 51 | 0 |
| `node ferramentas/testar-extracao.mjs` | 95 | 0 |
| `node ferramentas/testar-locais.mjs` | 22 | 0 |
| `node ferramentas/testar-ocorrencias.mjs` | 53 | 0 |
| `node ferramentas/testar-programacao.mjs` | 55 | 0 |
| **Node.js, subtotal** | **515** | **0** |

Ambiente: Windows, Node.js v24.22.1 e Chrome headless. Navegador com contexto novo e servidor HTTP local; conexões externas bloqueadas. Scripts Node.js executados no modo padrão de testes simulados, sem `--ao-vivo`; as dependências foram extraídas das versões e integridades do lockfile, sem scripts de instalação. Não houve chamadas pagas a provedores de IA.

Uma tentativa inicial pelo protocolo `file://` falhou em 11 casos que dependiam de `fetch` dos arquivos locais; a execução adequada em HTTP local concluiu os 457 casos sem falhas. Isso foi uma limitação do ambiente inicial, não uma correção no app. Não foram alterados os arquivos do FinCK para obter os resultados.

Não foram testados nesta execução o login real, a autorização entre usuários no banco publicado, as RPCs em produção, a qualidade das respostas de modelos ao vivo ou o efeito educativo com participantes. Um conjunto de testes aprovado não implica cobertura integral do aplicativo.

## Verificação da apresentação

- Preservados os 14 slides, os arquivos CSS e JavaScript, imagens e recursos de navegação.
- Conferidos notas, referências, mapa, ampliação de capturas, navegação por teclado e modo fluido de celular.
- Verificação local de JavaScript e de transbordamento do conteúdo; inspeção visual dos slides alterados.
- Conferidas as contas de projeção anual, conversão de taxa, valor aproximado da curva e horas de trabalho. Os resultados de demonstração do app não foram anunciados como medições de comportamento.

Esta revisão melhora a rastreabilidade e a precisão das afirmações. Não transforma pesquisas amostrais, estimativas ou registros internos em verdades sem incerteza.

## Roteiro e encerramento do grupo — 28/10/2026

- Organizadas 12 partes de conteúdo, duas por integrante, além da capa e do agradecimento: continuam sendo 14 telas de navegação.
- O antigo quadro final de resultados foi substituído pelo agradecimento. As verificações técnicas e suas limitações permanecem na metodologia, nas notas e neste relatório.
- Nomes completos, turma 2º C e curso M-Tec Informática para Internet conferidos na seção Equipe do site da CK. Somente Gustavo Oliveira dos Santos está confirmado nos itens 01 e 02; os responsáveis pelos itens 03 a 12, pela capa e pelo agradecimento estão a definir. A composição da equipe não determina a distribuição das falas nem a autoria histórica de cada funcionalidade.
- As falas e os tempos-alvo estão em [ROTEIRO-GRUPO.md](ROTEIRO-GRUPO.md) e no [PDF para o grupo](roteiro-finck-8-minutos.pdf). Oito minutos é a meta de ensaio, com 7min20s de fala-base e 40 segundos reservados para trocas e margem.
- Notas dos 12 itens alinhadas às falas do roteiro; explicações detalhadas ficam recolhidas como apoio para as perguntas. Mantidas as distinções entre pesquisas externas, simulações, registros internos e validação com usuários ainda pendente.
- Conferidos os 14 slides no navegador, os seis nomes do agradecimento, a organização em seis pares de itens, as notas e o encerramento em celular. PDF de oito páginas renderizado e inspecionado visualmente.
