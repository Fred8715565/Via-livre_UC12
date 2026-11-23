import { STEPS } from '../data/places'
import { useApp } from '../context/AppContext'
export default function RightPanel() {
  const { step } = useApp()
  return (<aside className="panel" aria-label="Trajeto do drone">
    <h2>Trajeto do drone</h2><p className="lead">Acompanhe cada etapa desde o pedido até a chegada</p>
    <ol className="timeline">{STEPS.map((s, i) => { const st = i < step || (step === 3 && i === 3) ? 'done' : i === step ? 'active' : ''
      return (<li key={s.title} className={st} aria-current={i === step ? 'step' : undefined}><span className="pt" aria-hidden="true" /><strong>{s.title}</strong><span>{s.d}</span>
        <span className="sr">{st === 'done' ? ' (concluída)' : st === 'active' ? ' (em andamento)' : ' (pendente)'}</span></li>) })}</ol>
    <div className="about"><b>Sobre o Via Livre:</b> o drone guia visualmente, com uma luz que você acompanha a pé, de cadeira de rodas, bengala de apoio ou carrinho. Por depender de visão, o serviço ainda não é indicado para pessoas com deficiência visual - para esse público, recomendamos apps de navegação por áudio e piso tátil.</div>
  </aside>)
}
