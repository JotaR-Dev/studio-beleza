# YA Studio de Beleza

Aplicação de agendamento para o Studio, com frontend Next.js e API Express/PostgreSQL.

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL

## Configuração local

Instale as dependências:

```bash
npm ci --prefix frontend
npm ci --prefix backend
```

Crie os arquivos de ambiente locais a partir dos exemplos:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Configure `DATABASE_URL` e um `JWT_SECRET` forte em `backend/.env`. Configure
`NEXT_PUBLIC_API_URL=http://localhost:3333/api` em `frontend/.env.local`.
As credenciais do WhatsApp Cloud API são necessárias para enviar notificações;
sem elas, o restante da aplicação pode ser desenvolvido localmente.

Crie/atualize as tabelas do banco e cadastre os serviços iniciais:

```bash
cd backend
npx drizzle-kit push
npx tsx src/db/seed.ts
```

O seed de serviços deve ser executado uma única vez em cada banco.

Para criar o usuário administrativo:

```bash
npm run seed:admin --prefix backend
```

No ambiente local, o seed usa `admin` / `admin` se nenhuma senha for
configurada. Altere essas credenciais antes de qualquer exposição externa. Em
produção, defina `NODE_ENV=production` e configure uma senha forte em
`ADMIN_PASSWORD`; o seed recusa criar a conta sem essa configuração.

## Executar

Inicie a API em um terminal:

```bash
npm run dev:backend
```

Inicie o frontend em outro:

```bash
npm run dev
```

O frontend usa `http://localhost:3000` e a API usa a porta `3333` por padrão.
O comando `npm run dev` inicia o frontend; `npm run dev:frontend` é um alias
explícito. Para executar diretamente os pacotes, use `npm run dev --prefix
frontend` ou `npm run dev --prefix backend`.

## Segurança e publicação

- Nunca publique `.env`, `.env.local` ou outros arquivos com credenciais.
- Os arquivos `.env.example` contêm apenas nomes de variáveis e valores de
  exemplo; substitua os placeholders no ambiente local/deploy.
- Configure `JWT_SECRET`, `DATABASE_URL`, credenciais do WhatsApp e
  `ADMIN_PASSWORD` como variáveis secretas no ambiente de produção.
- A API autoriza endpoints administrativos somente para contas com perfil
  `ADMIN`.
