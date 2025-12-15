# Configuração do Supabase Storage para VIVIMAP

## 1. Criar o Bucket de Fotos

1. Acesse o painel do Supabase
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure o bucket:
   - **Name**: `fotos`
   - **Public bucket**: ✅ Marcar (para permitir acesso às imagens)
   - Clique em **Create bucket**

## 2. Configurar Políticas de Storage

Vá em **Storage** > **Policies** e adicione as seguintes políticas para o bucket `fotos`:

### Política 1: Permitir Upload
```sql
-- Nome: Usuários podem fazer upload de suas fotos
-- Operação: INSERT
-- Policy definition:
(bucket_id = 'fotos'::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid)
```

### Política 2: Permitir Leitura Pública
```sql
-- Nome: Qualquer pessoa pode ver fotos públicas
-- Operação: SELECT
-- Policy definition:
bucket_id = 'fotos'::text
```

### Política 3: Permitir Atualização
```sql
-- Nome: Usuários podem atualizar suas fotos
-- Operação: UPDATE
-- Policy definition:
(bucket_id = 'fotos'::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid)
```

### Política 4: Permitir Deleção
```sql
-- Nome: Usuários podem deletar suas fotos
-- Operação: DELETE
-- Policy definition:
(bucket_id = 'fotos'::text) AND (auth.uid() = (storage.foldername(name))[1]::uuid)
```

## 3. Estrutura de Pastas

As fotos são organizadas por usuário:
```
fotos/
  ├── [user_id_1]/
  │   ├── foto1.jpg
  │   ├── foto2.jpg
  │   └── ...
  ├── [user_id_2]/
  │   ├── foto1.jpg
  │   └── ...
  └── ...
```

## 4. Verificar Configuração

Execute no SQL Editor:
```sql
-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'fotos';

-- Verificar políticas do bucket
SELECT * FROM storage.policies WHERE bucket_id = 'fotos';
```

## 5. Checklist Final

- ✅ Tabela `fotos` criada no banco de dados (execute `supabase_schema.sql`)
- ✅ Bucket `fotos` criado no Storage
- ✅ Bucket marcado como público
- ✅ 4 políticas de Storage configuradas
- ✅ Row Level Security habilitado na tabela
- ✅ 4 políticas RLS criadas na tabela

## 6. Testar

1. Faça login no app
2. Tire uma foto
3. Verifique se aparece no Storage em `fotos/[seu_user_id]/`
4. Verifique se aparece na tabela `fotos` no banco
5. Teste abrir a galeria e visualizar as fotos
