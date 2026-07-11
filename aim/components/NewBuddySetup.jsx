'use client';
import { useState } from 'react';
import {
  normalizeDescriptor,
  validatePassport,
  SUPPORTED_PROTOCOLS,
  SAMPLE_DESCRIPTORS,
} from '@/lib/adapters';
import { useAimStore } from '@/lib/store';
import { sounds } from '@/lib/sounds';
import UnderConstruction from './retro/UnderConstruction';

const PROTO_LABELS = {
  a2a: 'A2A — Google Agent Card',
  mcp: 'MCP — Model Context Protocol',
  acp: 'ACP — Agent Communication Protocol',
  anp: 'ANP — Agent Network Protocol',
  'fido-ap2': 'FIDO / AP2 — Credential Mapping',
};

// New Buddy Setup wizard (Phase 2.3): retro install-wizard styling, 4 steps.
export default function NewBuddySetup() {
  const { currentUser, upsertBuddy, pushNotification, soundOn } = useAimStore();
  const [step, setStep] = useState(1);
  const [protocolType, setProtocolType] = useState('a2a');
  const [descriptorText, setDescriptorText] = useState('');
  const [passport, setPassport] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  function loadExample() {
    setDescriptorText(JSON.stringify(SAMPLE_DESCRIPTORS[protocolType], null, 2));
    setError('');
  }

  function doNormalize() {
    setError('');
    try {
      const obj = JSON.parse(descriptorText);
      const p = normalizeDescriptor(protocolType, obj);
      const v = validatePassport(p);
      if (!v.valid) {
        setError('Invalid descriptor: ' + v.errors.join(', '));
        return;
      }
      setPassport(p);
      setStep(3);
    } catch (e) {
      setError('Could not parse JSON / descriptor: ' + (e.message || e));
    }
  }

  async function issue() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/passport/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport, ownerId: currentUser?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Issue failed');
      setResult(data);
      if (soundOn) sounds.signOn();
      upsertBuddy({
        id: data.agent.id,
        did: data.agent.did,
        screen_name: data.agent.screen_name,
        status: 'active',
        buddy_icon_hash: data.iconHash,
        protocol_type: passport.protocolType,
      });
      pushNotification({
        title: 'New Buddy Added!',
        body: `${data.agent.screen_name} received Agent Passport ${data.agent.did}`,
      });
      setStep(4);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs">
      {/* Wizard header banner (install-wizard blue side strip vibe) */}
      <div className="flex gap-2 mb-2">
        <div
          className="w-16 flex-shrink-0 flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(180deg,#0a41c4,#3f8cf3)' }}
        >
          <div className="text-2xl">🪪</div>
        </div>
        <div className="flex-1">
          <div className="font-bold">New Buddy Setup Wizard</div>
          <div className="text-[10px] text-win-shadow">
            Register an AI agent → issue a W3C Agent Passport (Step {step} of 4)
          </div>
        </div>
      </div>

      {/* Step 1: select protocol */}
      {step === 1 && (
        <div className="space-y-2">
          <p>Step 1 — Choose the agent's native protocol type:</p>
          <div className="panel-sunken p-2 space-y-1">
            {SUPPORTED_PROTOCOLS.map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="proto"
                  checked={protocolType === p}
                  onChange={() => setProtocolType(p)}
                />
                {PROTO_LABELS[p]}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button className="btn-95" onClick={() => setStep(2)}>
              Next &gt;
            </button>
          </div>
        </div>
      )}

      {/* Step 2: paste/upload descriptor */}
      {step === 2 && (
        <div className="space-y-2">
          <p>
            Step 2 — Paste the <b>{PROTO_LABELS[protocolType]}</b> descriptor JSON:
          </p>
          <textarea
            className="field-95 w-full h-40 font-mono text-[11px]"
            value={descriptorText}
            onChange={(e) => setDescriptorText(e.target.value)}
            placeholder="{ ... descriptor JSON ... }"
          />
          <div className="flex items-center gap-2">
            <button className="btn-95" onClick={loadExample}>
              Load example
            </button>
            <label className="btn-95 cursor-pointer">
              Upload file…
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setDescriptorText(String(r.result));
                  r.readAsText(f);
                }}
              />
            </label>
          </div>
          {error && <div className="text-aim-red">{error}</div>}
          <div className="flex justify-between">
            <button className="btn-95" onClick={() => setStep(1)}>
              &lt; Back
            </button>
            <button className="btn-95" onClick={doNormalize} disabled={!descriptorText.trim()}>
              Normalize &amp; Preview &gt;
            </button>
          </div>
        </div>
      )}

      {/* Step 3: preview normalized passport */}
      {step === 3 && passport && (
        <div className="space-y-2">
          <p>Step 3 — Preview the normalized canonical Passport:</p>
          <div className="panel-sunken p-2 space-y-1">
            <Row k="Screen Name" v={passport.screenName} />
            <Row k="Operator" v={passport.operatorName} />
            <Row k="Protocol" v={passport.protocolType.toUpperCase()} />
            <Row k="Capabilities" v={passport.capabilities.join(', ') || '—'} />
            <Row k="Endpoint" v={passport.protocolEndpoints?.url || '—'} />
            {passport.credentialMappings?.fidoAp2?.supported && (
              <Row k="FIDO/AP2" v={`mapped (${passport.credentialMappings.fidoAp2.role})`} />
            )}
          </div>
          <p className="text-[10px] text-win-shadow">
            On confirm, A.I.M. generates a DID + Verifiable Credential bundle and a
            deterministic pixel Buddy Icon seeded from the DID hash.
          </p>
          {error && <div className="text-aim-red">{error}</div>}
          <div className="flex justify-between">
            <button className="btn-95" onClick={() => setStep(2)}>
              &lt; Back
            </button>
            <button className="btn-primary" onClick={issue} disabled={busy}>
              {busy ? 'Issuing Passport…' : 'Confirm & Issue Passport'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: success */}
      {step === 4 && result && (
        <div className="space-y-2">
          <div className="text-center">
            <div className="text-3xl">🎉</div>
            <div className="font-bold text-aim-green">Agent Passport Issued!</div>
          </div>
          <div className="panel-sunken p-2 space-y-1 break-all">
            <Row k="Screen Name" v={result.agent.screen_name} />
            <Row k="DID" v={result.agent.did} />
            <Row k="Passport ID" v={result.passportId || '(local)'} />
            <Row k="VC Type" v="AgentPassportCredential" />
          </div>
          <UnderConstruction label="BUDDY ADDED TO LIST" />
          <div className="text-[10px] text-win-shadow">
            This buddy now appears in your Buddy List and is searchable via AgentWhois.
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 flex-shrink-0 font-bold">{k}:</span>
      <span className="flex-1 break-all">{v}</span>
    </div>
  );
}
