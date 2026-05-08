import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Globe,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "../utils";
import { useApp } from "../context/AppContext";
import { PresetWorkspaceActionDialog } from "../components/PresetWorkspaceActionDialog";
import { getTagColor } from "../lib/skillTags";
import * as api from "../lib/tauri";
import type { ManagedSkill, ToolInfo } from "../lib/tauri";
import { getErrorMessage } from "../lib/error";

function AddSkillDialog({
  agent,
  managedSkills,
  installedSkillIds,
  onAdd,
  onClose,
}: {
  agent: ToolInfo;
  managedSkills: ManagedSkill[];
  installedSkillIds: Set<string>;
  onAdd: (skillIds: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const available = useMemo(
    () =>
      managedSkills.filter(
        (skill) =>
          !installedSkillIds.has(skill.id) &&
          (search === "" ||
            skill.name.toLowerCase().includes(search.toLowerCase()) ||
            (skill.description || "").toLowerCase().includes(search.toLowerCase()))
      ),
    [installedSkillIds, managedSkills, search]
  );

  const toggleSelect = (skillId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setAdding(true);
    try {
      await onAdd(Array.from(selectedIds));
    } finally {
      setAdding(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !adding && onClose()}
      />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="text-[14px] font-semibold text-primary">
            {t("globalWorkspace.addSkillDialogTitle", { agent: agent.display_name })}
          </h2>
          <button
            onClick={onClose}
            disabled={adding}
            className="rounded-[4px] p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 border-b border-border-subtle px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("globalWorkspace.addSkillSearch")}
              className="app-input w-full pl-8"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          {available.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted">
              {installedSkillIds.size >= managedSkills.length && search === ""
                ? t("globalWorkspace.allInstalled")
                : t("globalWorkspace.noSkillsMatch")}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {available.map((skill) => {
                const selected = selectedIds.has(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSelect(skill.id)}
                    disabled={adding}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover",
                      selected && "bg-accent-bg"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        selected
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-transparent"
                      )}
                    >
                      {selected && (
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-primary">{skill.name}</div>
                      {skill.description && (
                        <div className="mt-0.5 truncate text-[12px] text-muted">{skill.description}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-subtle px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={adding}
              className="rounded-md border border-border-subtle px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:border-border hover:text-secondary disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || selectedIds.size === 0}
              className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t("globalWorkspace.addButton", { count: selectedIds.size })}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function GlobalWorkspace() {
  const { agentKey } = useParams<{ agentKey?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tools, managedSkills, scenarios, refreshManagedSkills, refreshTools } = useApp();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const installedTools = useMemo(() => tools.filter((t) => t.installed && t.enabled), [tools]);

  // Auto-navigate to first installed agent when no agentKey
  useEffect(() => {
    if (!agentKey && installedTools.length > 0) {
      navigate(`/global-workspace/${installedTools[0].key}`, { replace: true });
    }
  }, [agentKey, installedTools, navigate]);

  const currentTool = useMemo(
    () => (agentKey ? tools.find((t) => t.key === agentKey) ?? null : null),
    [agentKey, tools]
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const skill of managedSkills) {
      for (const tag of skill.tags) {
        if (tag.trim()) tags.add(tag);
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [managedSkills]);

  const agentSkills = useMemo(
    () =>
      agentKey
        ? managedSkills.filter((skill) =>
            skill.targets.some((target) => target.tool === agentKey)
          )
        : [],
    [agentKey, managedSkills]
  );

  const filtered = useMemo(() => {
    if (!search) return agentSkills;
    const q = search.toLowerCase();
    return agentSkills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(q) ||
        (skill.description || "").toLowerCase().includes(q)
    );
  }, [agentSkills, search]);

  const installedIds = useMemo(
    () => new Set(agentSkills.map((s) => s.id)),
    [agentSkills]
  );

  const handleRemove = async (skill: ManagedSkill) => {
    if (!agentKey) return;
    setRemovingId(skill.id);
    try {
      await api.unsyncSkillFromTool(skill.id, agentKey);
      await Promise.all([refreshManagedSkills(), refreshTools()]);
      toast.success(t("globalWorkspace.removedToast", { name: skill.name }));
    } catch (e) {
      toast.error(getErrorMessage(e, t("common.error")));
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddSkills = useCallback(
    async (skillIds: string[]) => {
      if (!agentKey) return;
      for (const skillId of skillIds) {
        await api.syncSkillToTool(skillId, agentKey);
      }
      await Promise.all([refreshManagedSkills(), refreshTools()]);
      toast.success(t("globalWorkspace.addedToast", { count: skillIds.length }));
      setAddDialogOpen(false);
    },
    [agentKey, refreshManagedSkills, refreshTools, t]
  );

  const globalWorkspaceAgents = useMemo(
    () =>
      currentTool
        ? [
            {
              key: currentTool.key,
              display_name: currentTool.display_name,
              enabled: currentTool.enabled,
              installed: currentTool.installed,
            },
          ]
        : [],
    [currentTool]
  );

  const existsInGlobal = useCallback(
    (skill: ManagedSkill, agentK: string) =>
      skill.targets.some((target) => target.tool === agentK),
    []
  );

  const handlePresetAdd = useCallback(async (skill: ManagedSkill, agentK: string) => {
    await api.syncSkillToTool(skill.id, agentK);
  }, []);

  const handlePresetRemove = useCallback(async (skill: ManagedSkill, agentK: string) => {
    await api.unsyncSkillFromTool(skill.id, agentK);
  }, []);

  const handlePresetComplete = useCallback(async () => {
    await Promise.all([refreshManagedSkills(), refreshTools()]);
  }, [refreshManagedSkills, refreshTools]);

  // No agents installed
  if (installedTools.length === 0) {
    return (
      <div className="app-page">
        <div className="app-panel flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover">
            <Globe className="h-5 w-5 text-muted" />
          </div>
          <p className="text-[13px] font-medium text-secondary">{t("globalWorkspace.noAgents")}</p>
          <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-muted">
            {t("globalWorkspace.noAgentsHint")}
          </p>
        </div>
      </div>
    );
  }

  // Waiting for auto-redirect or unknown agent key
  if (!currentTool) return null;

  return (
    <div className="app-page">
      {/* Header */}
      <div className="app-page-header pr-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="app-page-title flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-accent" />
            {currentTool.display_name}
            <span className="app-badge">{agentSkills.length}</span>
          </h1>
          <p className="app-page-subtitle">{t("globalWorkspace.subtitle")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <button
            onClick={() => setShowPresetDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-background px-3 py-2 text-[13px] font-medium text-secondary transition-colors hover:border-border hover:bg-surface-hover"
          >
            <Layers className="h-3.5 w-3.5" />
            {t("presetActions.button")}
          </button>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("globalWorkspace.addSkill")}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="app-toolbar">
        <div className="relative w-full max-w-[280px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("globalWorkspace.addSkillSearch")}
            className="app-input w-full pl-9 font-medium"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div className="app-segmented">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-2 transition-colors outline-none",
              viewMode === "grid" ? "bg-surface-active text-secondary" : "text-muted hover:text-tertiary"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-2 transition-colors outline-none",
              viewMode === "list" ? "bg-surface-active text-secondary" : "text-muted hover:text-tertiary"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Skills */}
      {filtered.length === 0 ? (
        agentSkills.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
            <Globe className="mb-4 h-12 w-12 text-faint" />
            <h3 className="mb-1.5 text-[14px] font-semibold text-tertiary">
              {t("globalWorkspace.noSkillsForAgent")}
            </h3>
            <button
              onClick={() => setAddDialogOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("globalWorkspace.addSkill")}
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
            <p className="text-[13px] text-muted">{t("mySkills.noMatch")}</p>
          </div>
        )
      ) : (
        <div
          className={cn(
            "pb-8",
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3 lg:grid-cols-3"
              : "flex flex-col gap-0.5"
          )}
        >
          {filtered.map((skill) => {
            const removing = removingId === skill.id;

            if (viewMode === "grid") {
              return (
                <div
                  key={skill.id}
                  className="app-panel group relative flex h-full flex-col transition-all hover:border-border hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <h3
                      className="flex-1 truncate text-[14px] font-semibold text-primary"
                      title={skill.name}
                    >
                      {skill.name}
                    </h3>
                  </div>

                  <div className="px-3.5 pb-3">
                    <p className="truncate text-[13px] leading-[18px] text-muted">
                      {skill.description || "—"}
                    </p>
                    {skill.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {skill.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                              getTagColor(tag, allTags)
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-end border-t border-border-subtle px-3.5 py-2">
                    <button
                      onClick={() => handleRemove(skill)}
                      disabled={removing}
                      title={t("globalWorkspace.removeSkill")}
                      className="rounded p-1 text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    >
                      {removing
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            }

            // List view
            return (
              <div
                key={skill.id}
                className="app-panel group flex items-center gap-3.5 rounded-xl border-transparent px-3.5 py-3 transition-all hover:border-border hover:bg-surface-hover"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <h3
                  className="w-[180px] shrink-0 truncate text-[14px] font-semibold text-secondary"
                  title={skill.name}
                >
                  {skill.name}
                </h3>
                <p className="min-w-0 flex-1 truncate text-[13px] text-muted">
                  {skill.description || "—"}
                </p>
                {skill.tags.length > 0 && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                          getTagColor(tag, allTags)
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => handleRemove(skill)}
                  disabled={removing}
                  title={t("globalWorkspace.removeSkill")}
                  className="shrink-0 rounded p-0.5 text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                >
                  {removing
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <PresetWorkspaceActionDialog
        open={showPresetDialog}
        title={t("presetActions.applyToGlobal")}
        presets={scenarios}
        managedSkills={managedSkills}
        agents={globalWorkspaceAgents}
        initialSelectedAgents={agentKey ? [agentKey] : []}
        onClose={() => setShowPresetDialog(false)}
        existsInWorkspace={existsInGlobal}
        onAddSkill={handlePresetAdd}
        onRemoveSkill={handlePresetRemove}
        onComplete={handlePresetComplete}
      />

      {addDialogOpen && currentTool && (
        <AddSkillDialog
          agent={currentTool}
          managedSkills={managedSkills}
          installedSkillIds={installedIds}
          onAdd={handleAddSkills}
          onClose={() => setAddDialogOpen(false)}
        />
      )}
    </div>
  );
}
