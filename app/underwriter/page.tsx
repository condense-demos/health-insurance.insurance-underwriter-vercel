"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const money = (v: any) => typeof v === "number"
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
  : "—";

const cls = (s = "") => s === "READY" ? "pill ready"
  : s === "READY_WITH_WARNINGS" ? "pill warn"
  : s === "NOT_READY" ? "pill danger"
  : "pill pending";

export default function Page() {
  const [apps, setApps] = useState<any[]>([]);
  const [id, setId] = useState("APP-10482");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const a = await fetch("/api/underwriter/applications", { cache: "no-store" });
      if (a.ok) setApps(await a.json());
      const r = await fetch(`/api/underwriter/application/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (r.status === 404) { setData(null); return; }
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unable to load");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [id]);

  return <main className="shell">
    <header className="top">
      <div><b className="brand">LifeSure</b><span>Underwriter Workbench</span></div>
      <nav><Link className="active" href="/underwriter">Underwriter</Link><Link href="/demo-control">Demo Control</Link></nav>
    </header>

    {err && <div className="error">{err}</div>}

    <div className="layout">
      <aside className="queue">
        <div className="eyebrow">CASE QUEUE</div><h2>Applications</h2>
        {apps.length === 0 && <div className="empty">No cases yet.</div>}
        {apps.map(a => <button key={a.applicationId} className={`case ${id === a.applicationId ? "selected" : ""}`} onClick={() => setId(a.applicationId)}>
          <div><b>{a.applicant}</b><span className={cls(a.readinessStatus)}>{a.readinessStatus?.replaceAll("_", " ")}</span></div>
          <small>{a.applicationId} · {a.product}</small><small>{money(a.faceAmount)} · {a.warningCount} warnings</small>
        </button>)}
      </aside>

      <section>{!data ? <div className="panel empty big">Waiting for case state from Condense.</div> : <>
        <div className="hero panel">
          <div><div className="eyebrow">APPLICATION {data.applicationId}</div><h1>{data.applicant.name}</h1><p>{data.applicant.age} years · {data.applicant.state} · {data.policy.product}</p></div>
          <div className="readyBox"><span>Underwriting readiness</span><b>{data.readiness.status.replaceAll("_", " ")}</b><span className={cls(data.readiness.status)}>{data.readiness.status}</span></div>
        </div>

        <div className="metrics">
          <div><span>Coverage</span><b>{money(data.policy.faceAmount)}</b></div>
          <div><span>Income</span><b>{money(data.policy.income)}</b></div>
          <div><span>Warnings</span><b>{data.readiness.warnings.length}</b></div>
          <div><span>Evidence outstanding</span><b>{data.readiness.outstandingEvidence.length}</b></div>
        </div>

        <div className="grid">
          <div className="panel"><h3>Application & Health</h3><div className="row"><span>DOB</span><b>{data.applicant.dateOfBirth}</b></div><div className="row"><span>Tobacco</span><b>{data.policy.tobacco}</b></div>{Object.entries(data.health.answers || {}).map(([k,v]) => <div className="row" key={k}><span>{k}</span><b>{String(v)}</b></div>)}</div>

          <div className="panel"><h3>Consent</h3><div className="row"><span>Received</span><b>{data.consent.received ? "Yes" : "No"}</b></div><div className="row"><span>Authorization</span><b>{data.consent.type || "—"}</b></div><div className="row"><span>Accepted</span><b>{data.consent.acceptedAt ? new Date(data.consent.acceptedAt).toLocaleString() : "—"}</b></div></div>

          <div className="panel"><h3>Warnings</h3>{data.readiness.warnings.length === 0 && <div className="good">No warnings.</div>}{data.readiness.warnings.map((w:any,i:number) => <div className="warning" key={i}>{w}</div>)}</div>

          <div className="panel"><h3>Prescription Data</h3>
            {data.externalData.length === 0 && <div className="empty">No external data yet.</div>}
            {data.externalData.map((x:any,i:number) => <div className="external evidenceDetail" key={i}>
              <div className="detailHeader"><div><b>{x.source}</b><small>External provider response</small></div><span className={cls(x.status === "RECEIVED" ? "READY" : "PENDING_EXTERNAL_DATA")}>{x.status}</span></div>
              {x.attributes?.nicotineIndicator !== undefined && <div className="flag"><span>Nicotine indicator</span><b>{x.attributes.nicotineIndicator ? "Detected" : "Not detected"}</b></div>}
              {x.attributes?.activeMedications?.length > 0 && <div className="detailSection"><label>Active medications</label>{x.attributes.activeMedications.map((m:any,j:number)=><div className="med" key={j}><b>{m.name}</b><span>{m.category} · Last filled {m.lastFilled}</span></div>)}</div>}
              <div className="detailGrid">
                {x.attributes?.prescriptionCountLast12Months !== undefined && <div><span>Prescriptions / 12 mo.</span><b>{x.attributes.prescriptionCountLast12Months}</b></div>}
                {x.attributes?.providerMatchConfidence !== undefined && <div><span>Match confidence</span><b>{Math.round(x.attributes.providerMatchConfidence * 100)}%</b></div>}
                {x.attributes?.sourceRecordDate && <div><span>Source record</span><b>{x.attributes.sourceRecordDate}</b></div>}
              </div>
            </div>)}
          </div>

          <div className="panel wide"><h3>Evidence Details</h3>
            {data.evidence.length === 0 && <div className="empty">No evidence requirements.</div>}
            <div className="evidenceGrid">{data.evidence.map((e:any,i:number) => <div className="evidenceCard" key={i}>
              <div className="detailHeader"><div><b>{e.type === "MEDICAL_EXAM" ? "Medical Exam" : e.type === "APS" ? "Attending Physician Statement (APS)" : e.type}</b><small>{e.reason}</small></div><span className={cls(e.status === "RECEIVED" ? "READY" : "PENDING_EVIDENCE")}>{e.status}</span></div>

              {e.status === "RECEIVED" && e.details && e.type === "MEDICAL_EXAM" && <>
                <div className="detailGrid three">
                  <div><span>Exam date</span><b>{e.details.examDate || "—"}</b></div><div><span>BMI</span><b>{e.details.bmi ?? "—"}</b></div><div><span>Blood pressure</span><b>{e.details.bloodPressure || "—"}</b></div>
                  <div><span>Height</span><b>{e.details.heightCm ? `${e.details.heightCm} cm` : "—"}</b></div><div><span>Weight</span><b>{e.details.weightKg ? `${e.details.weightKg} kg` : "—"}</b></div><div><span>Pulse</span><b>{e.details.pulseBpm ? `${e.details.pulseBpm} bpm` : "—"}</b></div>
                </div>
                <div className="detailSection"><label>Assessment</label><p>{e.details.generalAssessment || "—"}</p><small>Provider: {e.details.provider || "—"}</small></div>
              </>}

              {e.status === "RECEIVED" && e.details && e.type === "APS" && <>
                <div className="detailGrid">
                  <div><span>Physician</span><b>{e.details.physician || "—"}</b></div><div><span>Specialty</span><b>{e.details.specialty || "—"}</b></div><div><span>Last visit</span><b>{e.details.lastVisitDate || "—"}</b></div><div><span>Years as patient</span><b>{e.details.yearsAsPatient ?? "—"}</b></div>
                  <div><span>Recent hospitalization</span><b>{e.details.recentHospitalizations || "—"}</b></div><div><span>Major conditions</span><b>{Array.isArray(e.details.majorConditions) ? e.details.majorConditions.join(", ") : "—"}</b></div>
                </div>
                <div className="detailSection"><label>Clinical summary</label><p>{e.details.physicianSummary || "—"}</p></div>
                <div className="detailSection"><label>Current medications</label><p>{Array.isArray(e.details.currentMedications) ? e.details.currentMedications.join(", ") : "—"}</p></div>
              </>}
            </div>)}</div>
          </div>

          <div className="panel wide"><h3>Timeline</h3>{data.timeline.slice(0,10).map((t:any,i:number)=><div className="timeline" key={i}><i/><div><b>{t.eventType}</b><span>{t.message}</span><small>{new Date(t.timestamp).toLocaleTimeString()}</small></div></div>)}</div>
        </div>
      </>}</section>
    </div>
  </main>;
}
