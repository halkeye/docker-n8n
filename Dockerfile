ARG UPSTREAM_VERSION=1.71.2
FROM n8nio/n8n:$UPSTREAM_VERSION

WORKDIR /home/node/.n8n/nodes
RUN pnpm install \
  n8n-nodes-document-generator@1.0.9 \
  n8n-nodes-jwt@0.2.0 \
  n8n-nodes-webpage-content-extractor@0.1.2 \
  n8n-nodes-globals@1.0.3  \
  n8n-nodes-randomizer@0.1.0 \
  n8n-nodes-searxng@0.2.5 \
  @muench-dev/n8n-nodes-bluesky@2.2.0

WORKDIR /home/node/.n8n/hooks/
ENV N8N_FORWARD_AUTH_HEADER=x-authentik-email
ENV EXTERNAL_HOOK_FILES=/home/node/.n8n/hooks/autologin.js
COPY hooks/ /home/node/.n8n/hooks/

WORKDIR /home/node
