// Artifacts removed for TCC research app - chat only mode

export const artifactDefinitions: any[] = [];
export type ArtifactKind = string;

export type UIArtifact = {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: "streaming" | "idle";
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

export function Artifact() {
  return null;
}
