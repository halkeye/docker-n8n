ARG UPSTREAM_VERSION="1.69.2"
FROM n8nio/n8n:$UPSTREAM_VERSION

RUN mkdir /home/node/.n8n/nodes && \
  cd /home/node/.n8n/nodes && \
  npm install \
  n8n-nodes-document-generator \
  n8n-nodes-jwt@0.2.0 \
  n8n-nodes-webpage-content-extractor@0.1.2 \
  n8n-nodes-globals@1.0.3  \
  n8n-nodes-randomizer@0.1.0 \
  n8n-nodes-searxng@0.2.5 \
  @muench-dev/n8n-nodes-bluesky@2.2.0 \
  n8n-nodes-pdfkit@0.1.2 


# USER 1000
