import { NodeTypes } from "@xyflow/react";
import { WebsiteNode } from "./nodes/WebsiteNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { InputNode } from "./nodes/InputNode";
import { OutputNode } from "./nodes/OutputNode";
import { AINode } from "./nodes/AINode";
import { StartNode } from "./nodes/StartNode";
import { EndNode } from "./nodes/EndNode";
import { DelayNode } from "./nodes/DelayNode";
import { TransformNode } from "./nodes/TransformNode";
import { NoteNode } from "./nodes/NoteNode";

export const nodeTypes: NodeTypes = {
  websiteNode: WebsiteNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  inputNode: InputNode,
  outputNode: OutputNode,
  aiNode: AINode,
  startNode: StartNode,
  endNode: EndNode,
  delayNode: DelayNode,
  transformNode: TransformNode,
  noteNode: NoteNode,
};
