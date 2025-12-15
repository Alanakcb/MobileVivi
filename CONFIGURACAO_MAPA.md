# 🗺️ Configuração do Mapa com Geolocalização

## 📋 Passo a Passo

### 1️⃣ Atualizar Banco de Dados Supabase

Acesse o **Supabase Dashboard** → **SQL Editor** e execute o script:

```sql
-- Adicionar colunas de geolocalização
ALTER TABLE fotos 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_fotos_location 
ON fotos (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Validar coordenadas
ALTER TABLE fotos 
ADD CONSTRAINT check_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT check_longitude CHECK (longitude >= -180 AND longitude <= 180);
```

---

### 2️⃣ Obter Google Maps API Key

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto (ou use existente)
3. Ative as APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
4. Vá em **Credenciais** → **Criar Credenciais** → **Chave de API**
5. Copie a chave gerada
6. (Recomendado) Restrinja a chave:
   - Android: Adicione SHA-1 do seu keystore
   - iOS: Adicione Bundle ID do app

---

### 3️⃣ Configurar API Key no app.json

Abra `app.json` e substitua `YOUR_GOOGLE_MAPS_API_KEY` pela sua chave real:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

---

### 4️⃣ Instalar Dependências

```bash
npm install react-native-maps expo-location
```

---

### 5️⃣ Recompilar o App

Como adicionamos bibliotecas nativas, você precisa recompilar:

**Opção A - Development Build Local:**
```bash
npx expo run:android
# ou
npx expo run:ios
```

**Opção B - EAS Build:**
```bash
eas build --profile development --platform android
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Na Tela da Câmera:
- Captura automática da localização ao tirar foto
- Solicita permissão de localização automaticamente
- Salva latitude e longitude junto com a foto

### ✅ Na Tela do Mapa:
- Exibe mapa com localização atual do usuário
- **Pins vermelhos** em cada localização onde foto foi tirada
- Ícone de câmera dentro do pin
- Ao clicar no pin: abre modal com:
  - Imagem da foto
  - Legenda
  - Data
  - Coordenadas geográficas

### ✅ Recursos Técnicos:
- Sistema de coordenadas: **WGS84**
- Projeção: **Web Mercator (EPSG:3857)**
- Precisão GPS: 5-10 metros (padrão)
- Filtro: Apenas fotos com localização aparecem no mapa
- Performance: Índice espacial no banco de dados

---

## 📱 Como Testar

1. **Abra a câmera** e tire uma foto
   - Permita acesso à localização quando solicitado
   - A localização será capturada automaticamente

2. **Abra o mapa**
   - Verá pins vermelhos onde as fotos foram tiradas
   - Clique em um pin para ver a foto

3. **Teste offline:**
   - As fotos já salvas com localização aparecerão
   - Novas fotos precisam de GPS ativo

---

## 🔐 Permissões Necessárias

### Android:
- `ACCESS_FINE_LOCATION` - GPS preciso
- `ACCESS_COARSE_LOCATION` - Localização aproximada
- `CAMERA` - Câmera

### iOS:
- `NSLocationWhenInUseUsageDescription` - Localização durante uso
- `NSCameraUsageDescription` - Câmera

---

## 🐛 Troubleshooting

### ❌ Mapa não aparece (tela branca)
**Causa:** API Key não configurada ou inválida

**Solução:**
1. Verifique se colocou a chave no `app.json`
2. Confirme que ativou as APIs no Google Cloud
3. Recompile o app

---

### ❌ Pins não aparecem
**Causa:** Fotos antigas não têm localização

**Solução:**
- Tire novas fotos após a atualização
- Fotos antigas não terão localização (é normal)

---

### ❌ Erro de permissão de localização
**Causa:** Usuário negou permissão

**Solução:**
1. Vá em Configurações do celular
2. Aplicativo → VIVIMAP
3. Permissões → Localização → Permitir

---

### ❌ Localização imprecisa
**Causa:** GPS fraco ou em ambiente fechado

**Solução:**
- Tire fotos em ambiente externo
- Aguarde alguns segundos para GPS estabilizar
- Use Wi-Fi ligado (ajuda na precisão)

---

## 📊 Estrutura de Dados

### Tabela `fotos`:
```sql
CREATE TABLE fotos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  legenda TEXT,
  data TIMESTAMP DEFAULT NOW(),
  latitude DOUBLE PRECISION,  -- Nova coluna
  longitude DOUBLE PRECISION, -- Nova coluna
  CONSTRAINT check_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT check_longitude CHECK (longitude >= -180 AND longitude <= 180)
);
```

---

## 🎓 Conceitos Aplicados

### Sistema de Coordenadas WGS84:
- **Latitude**: -90° (Polo Sul) a +90° (Polo Norte)
- **Longitude**: -180° (Oeste) a +180° (Leste)
- **Varginha, MG**: -21.5561°, -45.4345°

### Projeção Web Mercator:
- Padrão em mapas digitais (Google Maps, OpenStreetMap)
- Preserva ângulos (conformal)
- Distorce áreas em altas latitudes

### Precisão GPS:
- GPS padrão: 5-10 metros
- GPS + Wi-Fi/Cell ID: 10-50 metros (indoor)
- RTK GPS: 2-10 centímetros (profissional)

---

## 🚀 Próximas Melhorias (Opcional)

1. **Rotas entre fotos:**
   - Polyline conectando pontos
   - Algoritmo A* para rota otimizada

2. **Clustering de markers:**
   - Agrupar pins próximos em zoom out
   - Melhor UX com muitas fotos

3. **Filtros:**
   - Por data
   - Por proximidade
   - Por legenda

4. **Heatmap:**
   - Visualizar densidade de fotos
   - Áreas mais fotografadas

5. **Geocoding:**
   - Converter coordenadas em endereço
   - Mostrar "Rua X, Bairro Y"

6. **Offline Maps:**
   - Cache de tiles do mapa
   - Funcionar sem internet

---

## ✅ Checklist de Implementação

- [x] Instalado react-native-maps e expo-location
- [x] Adicionado permissões no app.json
- [x] Atualizado serviço de fotos para salvar localização
- [x] Modificado tela da câmera para capturar GPS
- [x] Criado tela de mapa com markers
- [x] Implementado modal para exibir foto ao clicar
- [ ] Executar script SQL no Supabase
- [ ] Configurar Google Maps API Key
- [ ] Recompilar app (expo run:android ou EAS)
- [ ] Testar em dispositivo real

---

**Tudo pronto! Agora seu app tem mapa com pins nas localizações das fotos! 📍📸🗺️**
