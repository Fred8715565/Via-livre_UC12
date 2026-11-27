export default function PageHead({ title, sub, children }) {
  return <div className="head"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div><div className="acts">{children}</div></div>
}
