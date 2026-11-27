import { offset } from '../services/geo'
const C = [-20.2632, -40.4165]
const at = (m, deg) => offset(C, m, deg) // distâncias iguais às do design
export const PLACES = [
 { id:'p1', key:'biblioteca', name:'Biblioteca Central', emoji:'📚', rating:4.8, reviews:126, address:'Av. Central, 120 — Centro', hours:'8h–20h', about:'Biblioteca pública com entrada por rampa, elevador para todos os andares e banheiro adaptado no térreo, ao lado da recepção.', features:['Rampa','Elevador','Banheiro adaptado'], pos:at(340, 60) },
 { id:'p2', key:'cafe', name:'Café da Esquina', emoji:'☕', rating:4.5, reviews:58, address:'Rua das Flores, 45', hours:'7h–19h', about:'Cafeteria com entrada sem degraus e mesas com espaço livre por baixo para cadeira de rodas.', features:['Entrada nivelada','Mesa acessível'], pos:at(190, 150) },
 { id:'p3', key:'farmacia', name:'Farmácia Bem-Estar', emoji:'💊', rating:4.6, reviews:41, address:'Rua Sete de Setembro, 210', hours:'24 horas', about:'Rampa suave na entrada e um balcão de atendimento em altura acessível.', features:['Rampa','Balcão baixo'], pos:at(280, 290) },
 { id:'p4', key:'praca', name:'Praça do Mercado', emoji:'🌳', rating:4.3, reviews:80, address:'Praça do Mercado, s/n', hours:'Aberta 24h', about:'Praça com piso nivelado em todo o percurso principal e vagas PCD próximas à entrada.', features:['Piso nivelado','Vaga PCD'], pos:at(510, 230) },
 { id:'p5', key:'restaurante', name:'Restaurante Sabor Caseiro', emoji:'🍽️', rating:4.7, reviews:97, address:'Av. Beira Mar, 880', hours:'11h–15h, 18h–23h', about:'Restaurante com rampa na entrada, banheiro adaptado e mesas amplas reservadas perto da porta.', features:['Rampa','Banheiro adaptado','Mesa acessível'], pos:at(620, 120) },
 { id:'p6', key:'posto', name:'Posto de Saúde Vitória', emoji:'🏥', rating:4.4, reviews:64, address:'Rua da Saúde, 33', hours:'7h–17h', about:'Unidade com rampa de acesso, elevador entre os pavimentos e vagas reservadas na frente.', features:['Rampa','Elevador','Vaga PCD'], pos:at(700, 330) }
]

// Pontos adicionais ilustrativos para ampliar a exploração inicial.
// Endereços, posições e recursos devem ser validados pela comunidade antes de uma visita.
const EXTRA = [
 ['Centro Cultural', '🎭','Centro','Rampa'],['Parque Municipal', '🌲','Centro','Piso nivelado'],['Terminal Urbano', '🚌','Centro','Entrada nivelada'],['Centro Esportivo', '🏟️','Campo Grande','Vaga PCD'],['Museu da Cidade', '🏛️','Centro','Rampa'],
 ['Unidade de Saúde', '🏥','Campo Grande','Banheiro adaptado'],['Mercado Municipal', '🛒','Centro','Entrada nivelada'],['Praça da Estação', '🌳','Centro','Piso nivelado'],['Biblioteca do Bairro', '📚','Jardim América','Rampa'],['Restaurante Popular', '🍽️','Centro','Mesa acessível'],
 ['Centro de Atendimento', '🏢','Campo Grande','Elevador'],['Feira Comunitária', '🥬','Centro','Piso nivelado'],['Quadra Pública', '🏀','Jardim América','Vaga PCD'],['Parque Infantil', '🛝','Campo Grande','Piso nivelado'],['Igreja do Centro', '⛪','Centro','Rampa'],
 ['Espaço de Eventos', '🎪','Campo Grande','Entrada nivelada'],['Agência de Serviços', '🏦','Centro','Elevador'],['Ponto de Cultura', '🎨','Jardim América','Rampa'],['Centro de Convivência', '🤝','Campo Grande','Banheiro adaptado'],['Polo Educacional', '🎓','Centro','Elevador']
].map(([name, emoji, neighborhood, feature], i) => ({ id:`extra${i+1}`, name, emoji, address:`${neighborhood} — Cariacica, ES (localização ilustrativa)`, hours:'Consulte o local', about:'Ponto demonstrativo. Endereço, acessibilidade e funcionamento ainda precisam ser confirmados por moradores antes do deslocamento.', notes:'Informação comunitária pendente de validação.', features:[feature], pos:at(850 + i*85, (i*47)%360) }))
PLACES.push(...EXTRA)

export const HISTORY0 = [
 { id:'h1', name:'Biblioteca Central', emoji:'📚', date:'2 de setembro', rating:5, placeId:'p1', via:'Uber' },
 { id:'h2', name:'Café da Esquina', emoji:'☕', date:'28 de agosto', rating:4, placeId:'p2', via:'Maps' },
 { id:'h3', name:'Farmácia Bem-Estar', emoji:'💊', date:'20 de agosto', rating:5, placeId:'p3', via:'Uber' },
 { id:'h4', name:'Praça do Mercado', emoji:'🌳', date:'12 de agosto', rating:4, placeId:'p4', via:'Maps' }
]
export const PROFILE0 = { name:'Marina Alves', mobility:['Cadeira de rodas'], confirm:true, wav:true, mapsMode:'walking', ecName:'Fulano', ecPhone:'(27) 99999-0000', textSize:100 }
export const MOBILITY = ['Cadeira de rodas','Andador','Bengala de apoio','Mobilidade reduzida','Idoso(a)']
