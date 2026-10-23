# Conscious Knowledge

Site estático da CK, com página principal e duas apresentações. Usa HTML, CSS, JavaScript e imagens locais; as fontes do Google e os links para os aplicativos dependem de acesso à internet. Não há servidor de aplicação, banco de dados ou instalação de pacotes neste repositório.

## Atividade de Docker

Comece pelo [passo a passo da Aula 22](atividade-docker/README.md). O laboratório, as duas versões do HTML e o [relatório editável](atividade-docker/relatorio.html) estão em `atividade-docker/`.

Os arquivos foram preparados e conferidos estaticamente. A execução Docker, os quatro prints reais e a entrega do relatório ainda dependem da dupla. Nenhum resultado de execução é presumido.

## Site completo com Nginx

Extensão opcional: execute pessoalmente no terminal Linux do Killercoda, na raiz deste repositório. Este teste usa outra imagem, outro container e a porta 8081, sem substituir o exercício `projeto:v1`/`projeto:v2` na porta 8080.

```bash
docker build -t ck-group:local .
docker run -d --name ck-group-local -p 8081:80 ck-group:local
curl -I http://localhost:8081/
curl -I http://localhost:8081/style.css
curl -I http://localhost:8081/script.js
curl -I http://localhost:8081/midia/icone-ck-32.png
curl -I http://localhost:8081/apresentacao/
curl -I http://localhost:8081/apresentacao-projeto/
```

Confira as respostas HTTP e, se quiser visualizar o site, use a prévia da porta 8081 do Killercoda. `localhost` no seu navegador local não aponta para o laboratório remoto. Não há publicação de uma imagem no Docker Hub nem implantação permanente por esses comandos.

Após conferir e salvar o necessário, encerre apenas seu container opcional:

```bash
docker stop ck-group-local
docker rm ck-group-local
```

O Dockerfile copia explicitamente HTML, CSS, JS, mídia e as apresentações. Copiar só o `index.html` da raiz deixaria o site sem seus recursos. A pasta da atividade e o relatório não entram nessa imagem.
