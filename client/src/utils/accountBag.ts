import type { CartItem } from "../types";
export interface RemoteBag { items: CartItem[]; revision: number; initialized: boolean }
export interface BagTransport {
  get: () => Promise<RemoteBag>;
  prepareImport?: (items: CartItem[]) => Promise<CartItem[]>;
  replace: (items: CartItem[], revision: number) => Promise<RemoteBag>;
}
export interface BagSnapshot { items: CartItem[]; loading: boolean; saving: number; error: string }

// Serializes changes for one authenticated identity. This instance is never reused
// for another login, and pending saves retain their original authentication token.
export class AccountBag {
  private snapshot: BagSnapshot;
  private listeners = new Set<() => void>();
  private revision = 0;
  private started?: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private localItems: CartItem[];
  private persist: (items: CartItem[]) => void;
  private transport?: BagTransport;
  constructor(localItems: CartItem[], persist: (items: CartItem[]) => void, transport?: BagTransport) {
    this.localItems=localItems; this.persist=persist; this.transport=transport;
    this.snapshot = { items: transport ? [] : localItems, loading: !!transport, saving: 0, error: "" };
  }
  getSnapshot = (): BagSnapshot => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<BagSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach(listener => listener());
  }
  private accept(remote: RemoteBag) {
    this.revision = remote.revision;
    this.persist(remote.items);
    this.publish({ items: remote.items, loading: false, error: "" });
  }
  start = (): Promise<void> => {
    if (!this.transport) return Promise.resolve();
    if (this.started) return this.started;
    this.publish({ loading: true, error: "" });
    this.started = (async () => {
      let remote = await this.transport!.get();
      // Import this account's browser bag once, never its guest bag. An explicitly
      // cleared remote bag stays empty on every other device.
      if (!remote.initialized && this.localItems.length) {
        try { const items = this.transport!.prepareImport ? await this.transport!.prepareImport(this.localItems) : this.localItems;
          remote = await this.transport!.replace(items, remote.revision); }
        catch (error) {
          if ((error as {response?:{status?:number}}).response?.status !== 409) throw error;
          remote = await this.transport!.get();
        }
      }
      this.accept(remote);
    })().catch(error => {
      this.started = undefined;
      this.publish({loading:false,error:"Couldn’t load your saved bag. Try again when you’re connected."});
      throw error;
    });
    return this.started;
  };
  change = (update: (items: CartItem[]) => CartItem[]): Promise<boolean> => {
    this.publish({ saving: this.snapshot.saving + 1 });
    const task = this.queue.then(async () => {
      try {
        await this.start();
        const items = update(this.snapshot.items);
        if (items.length > 100 || items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 999)) {
          this.publish({ error: "A bag can hold up to 100 products, with a quantity from 1 to 999 each." }); return false;
        }
        if (this.transport) this.accept(await this.transport.replace(items, this.revision));
        else { this.persist(items); this.publish({items,error:""}); }
        return true;
      } catch (error) {
        const status = (error as {response?:{status?:number}}).response?.status;
        if (status === 409 && this.transport) {
          try { this.accept(await this.transport.get()); } catch { /* Keep the previous valid snapshot. */ }
          this.publish({error:"Your bag changed on another device. We refreshed it; please try your change again."});
        } else {
          this.publish({error:(error as {response?:{data?:{message?:string}}}).response?.data?.message || "Your bag wasn’t saved. Check your connection and try again."});
        }
        return false;
      } finally { this.publish({saving:Math.max(0,this.snapshot.saving-1)}); }
    });
    this.queue = task;
    return task;
  };
  refresh = (): Promise<void> => {
    const task = this.queue.then(async () => {
      if (!this.transport) return;
      if (!this.started) { await this.start(); return; }
      this.accept(await this.transport.get());
    }).catch(() => { this.publish({error:"Couldn’t refresh your saved bag. Check your connection and try again."}); });
    this.queue = task;
    return task;
  };
}
