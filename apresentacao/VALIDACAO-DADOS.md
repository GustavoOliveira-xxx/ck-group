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
| Score 505 e média 548 sem data | Identificados como retrato de abril de 2025, conforme o [texto da Serasa](https://www.serasa.com.br/score/blog/media-score-serasa-conheca-mapa-score/). Score não foi tratado como teste de educação financeira. A página consultada contém imagens/textos alternativos com números diferentes dos parágrafos; a apresentação usa os valores explicitamente publicados nos parágrafos. |
| 19,4% de comprometimento superior à metade da renda, setembro de 2026 | Não localizado no comunicado primário consultado. Substituído por 19,0% de julho de 2026, explicitamente publicado pela [CNC em 6/8/2026](https://portaldocomercio.org.br/acoes-institucionais/cnc-endividamento-e-o-maior-da-serie-historica/). Não se declarou falso o número anterior. |
| Cartão como “principal dívida” de 85,3% | Corrigido para proporção dos endividados que citaram cartão entre as dívidas, julho de 2026. Não é proporção de todas as famílias nem uma pergunta exclusiva sobre a dívida principal. |
| “2,5 vezes maior” | Precisado como “2,5 vezes a proporção”, comparação aproximada de 38,5% com 15,1%, nas faixas de renda indicadas. |
| Serasa: meses e bases misturados | Separados agosto (83,98 milhões) e fevereiro de 2026 (81,7 milhões, crescimento em dez anos e renda). Os 48% com até um salário mínimo constam do estudo de dez anos vinculado ao [release da Serasa](https://www.serasa.com.br/imprensa/10-anos-do-mapa-de-inadimplencia/). |
| Renda e CadÚnico locais sustentados por compilação, sem conferência primária | Substituídos por área territorial de 20,371 km², referência 2025 do [IBGE](https://www.ibge.gov.br/cidades-e-estados/sp/taboao-da-serra.html), e urbanização de 100% em 2022, do [perfil oficial municipal](https://www.ts.sp.gov.br/portal/servicos/1010/perfil-de-taboao-da-serra). Preservados população e densidade do Censo 2022. Não recalcular densidade com área de outro ano. |
| Teoria apresentada como eficácia do recurso | Retiradas afirmações de que o custo em horas provoca deliberação ou pesa mais que preço monetário. Mantidas como hipóteses de desenho, sem confirmação no FinCK. Shefrin e Statman (1985) identificados pelo tema real, efeito disposição em investimentos. |
| “Equação de Thoreau” | Identificada como adaptação didática. A frase foi conferida em [Walden, capítulo Economy](https://www.gutenberg.org/files/205/205-h/205-h.htm). Substituída página específica por capítulo, pois a paginação depende da edição. A fórmula financeira não foi atribuída como equação publicada por Thoreau. |
| “Auditorias externas” e “H2 confirmada” | Substituídas por revisões técnicas internas e hipótese pendente de validação com usuários. |

## Dados externos preservados

- CNC/Peic: 82,0% em julho/agosto e 81,7% em setembro de 2026; 29,6% com atraso em setembro; comparação por renda de julho e 18,3% sem condições de pagamento na faixa de menor renda em agosto. Conferência nos comunicados oficiais de [julho](https://portaldocomercio.org.br/acoes-institucionais/cnc-endividamento-e-o-maior-da-serie-historica/), [agosto](https://portaldocomercio.org.br/acoes-institucionais/cnc-mais-endividadas-do-que-a-media-familias-de-menor-renda-lideram-avanco-na-inadimplencia-em-agosto/) e [setembro](https://portaldocomercio.org.br/acoes-institucionais/cnc-inadimplencia-e-endividamento-das-familias-brasileiras-recuam-em-setembro/).
- CNDL/SPC: 75,05 milhões e 44,67% da população adulta em setembro de 2026, conforme [comunicado de 20/10/2026](https://cndl.org.br/varejosa/inadimplencia-volta-a-crescer-no-brasil-e-atinge-7505-milhoes-de-consumidores-em-setembro-aponta-cndl-e-spc-brasil/).
- BCB: comprometimento de renda de 28,7%, julho de 2026, conforme [nota de 29/9/2026](https://www.bcb.gov.br/content/estatisticas/hist_estatisticasmonetariascredito/202609_Texto_de_estatisticas_monetarias_e_de_credito.pdf).
- Serasa/Opinion Box: 46% e 54%, descritos como autorrelatos. [Release original da assessoria](https://saladeimprensa.trevocomunica.com/releases/46-dos-brasileiros-ja-realizaram-compras-por-impulso-para-se-sentirem-melhor-emocionalmente-revela-pesquisa-serasa/1008832): 1.240 entrevistas online, 8–19/8/2025; margem de erro informada de 2,8 pontos percentuais.
- YOUPIX/Nielsen: 80% já compraram algo indicado por influenciador, conforme [publicação das responsáveis pelo estudo em 2025](https://youpix.com.br/relevancia-pra-alem-do-hype-o-que-os-dados-dizem-sobre-influencia-e-consumo/). Não foi transformado em taxa de compras impulsivas.

## Limites e dados internos

Foram preservados os números técnicos internos solicitados: 973 testes registrados, divisão 458/515, rodadas de UX, distância até decisão, etapas, termos de IA, 1,2 s em verificação pontual, quatro correções, tabelas, migrações, políticas, funções, níveis, conquistas e regras de XP. A revisão não reproduziu a suíte do aplicativo, nem reexecutou a verificação de produção de 15/10/2026. Esses números não receberam status de auditados externamente.

Valores nas capturas e na demonstração não representam um estudo de usuários. “Economia confirmada” é o nome de um registro baseado no relato posterior da pessoa, sem comprovação independente. Não há mensuração apresentada de redução de consumo impulsivo, confiança ou resíduos.

Os documentos internos da escola e os registros de desenvolvimento foram preservados como fontes internas; esta revisão não constitui autenticação desses documentos.

## Verificação da apresentação

- Preservados os 14 slides, os arquivos CSS e JavaScript, imagens e recursos de navegação.
- Conferidos notas, referências, mapa, ampliação de capturas, navegação por teclado e modo fluido de celular.
- Verificação local de JavaScript e de transbordamento do conteúdo; inspeção visual dos slides alterados.
- Conferidas as contas de projeção anual, conversão de taxa, valor aproximado da curva e horas de trabalho. Os resultados de demonstração do app não foram anunciados como medições de comportamento.

Esta revisão melhora a rastreabilidade e a precisão das afirmações. Não transforma pesquisas amostrais, estimativas ou registros internos em verdades sem incerteza.
