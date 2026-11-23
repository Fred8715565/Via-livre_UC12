const [la, lo] = [-20.2632, -40.4165]
export const PLACES = [
 { id:'p1', name:'Biblioteca Central', emoji:'📚', rating:4.8, reviews:126, features:['Rampa','Elevador','Banheiro adaptado'], pos:[la+0.0015, lo+0.0029] },
 { id:'p2', name:'Café da Esquina', emoji:'☕', rating:4.5, reviews:58, features:['Entrada nivelada','Mesa acessível'], pos:[la-0.0010, lo+0.0016] },
 { id:'p3', name:'Café da Esquina', emoji:'☕', rating:4.6, reviews:41, features:['Rampa','Balcão baixo'], pos:[la+0.0012, lo-0.0024] },
 { id:'p4', name:'Praça do Mercado', emoji:'🌳', rating:4.3, reviews:80, features:['Piso nivelado','Vaga PCD'], pos:[la-0.0030, lo-0.0035] },
 { id:'p5', name:'Farmácia Bem-Estar', emoji:'💊', rating:4.4, reviews:33, features:['Rampa','Piso nivelado','Balcão baixo'], pos:[la-0.0034, lo+0.0025] }
]
export const HISTORY0 = [
 { id:'h1', name:'Biblioteca Central', emoji:'📚', date:'2 de setembro', rating:5, placeId:'p1' },
 { id:'h2', name:'Café da Esquina', emoji:'☕', date:'28 de agosto', rating:4, placeId:'p2' },
 { id:'h3', name:'Farmácia Bem-Estar', emoji:'💊', date:'20 de agosto', rating:5, placeId:'p5' },
 { id:'h4', name:'Praça do Mercado', emoji:'🌳', date:'12 de agosto', rating:4, placeId:'p4' }
]
export const PROFILE0 = { name:'Marina Alves', mobility:['Cadeira de rodas'], sound:true, vibration:true, slow:false, ecName:'Fulano', ecPhone:'(27) 99999-0000', textSize:100 }
export const MOBILITY = ['Cadeira de rodas','Andador','Bengala de apoio','Vaga PCD','Mobilidade reduzida','Idoso(a)']
export const STEPS = [
 { t:0, title:'Sinal enviado', d:'Aguardando confirmação', live:'Procurando o drone mais próximo...', msg:'Sinal enviado. Procurando o drone mais próximo.' },
 { t:3000, title:'Drone decolou', d:'Vindo até sua localização', live:'Drone a caminho da sua localização', msg:'O drone decolou e está vindo até você.' },
 { t:7000, title:'Guiando o trajeto', d:'Siga a luz azul do drone', live:'Siga a luz azul do drone', msg:'O drone está guiando o trajeto. Siga a luz azul.' },
 { t:15000, title:'Chegada', d:'Destino acessível confirmado', live:'Destino acessível confirmado', msg:'Você chegou ao destino!' }
]
export const stepAt = t => STEPS.reduce((s, x, i) => (t >= x.t ? i : s), 0)
