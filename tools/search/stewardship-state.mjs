// Pure state reconciliation for CuratorOS stewardship snapshots.
// Review decisions are reserved for a future authenticated workflow.
export function reconcile(previous, current, now, healthyTypes) {
  const prior = new Map((previous?.cases || []).map(item => [item.id,item]));
  const active = new Map(current.map(item => [item.id,item]));
  const typesHealthy = new Set(healthyTypes);
  const cases = [];
  const changes = {new:[], continuing:[], resolved:[], unverified:[]};
  for (const item of current) {
    const old = prior.get(item.id);
    const value = {
      ...item,
      firstSeen: old?.firstSeen || now,
      lastSeen: now,
      lastChanged: !old || JSON.stringify(old.evidence) !== JSON.stringify(item.evidence) ? now : old.lastChanged || now,
      lifecycle:'active',
      occurrences:(old?.occurrences || 0)+1
    };
    cases.push(value);
    changes[old?.lifecycle === 'active' ? 'continuing' : 'new'].push(item.id);
  }
  for (const old of prior.values()) {
    if (active.has(old.id)) continue;
    const family = old.type.startsWith('canonical:') ? 'canonical' :
      old.type.startsWith('link:') || old.type.startsWith('discovery:') ? 'internal-links' : 'unknown';
    if (!typesHealthy.has(family)) {
      cases.push({...old, lifecycle:'unverified'});
      changes.unverified.push(old.id);
    } else {
      const updated = {...old, lifecycle:'resolved', resolvedAt: old.resolvedAt || now};
      cases.push(updated);
      if (old.lifecycle !== 'resolved') changes.resolved.push(old.id);
    }
  }
  cases.sort((a,b)=>a.id.localeCompare(b.id));
  return {schemaVersion:1,generatedAt:now,cases,changes};
}
