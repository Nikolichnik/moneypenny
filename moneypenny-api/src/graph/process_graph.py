"""
The ProcessGraph module.
"""

from logging import getLogger

import os

import gc

from typing import Any, Type, Union, get_type_hints

from langchain.agents import create_agent

from langgraph.graph import StateGraph, START, END

from common.constants import (
    NODE_ENTRY_POINT,
    NODE_VALIDATE_STATE,
    NODE_SET_UP,
    NODE_PROCESS,
    NODE_EXIT_POINT,
    MODEL_GPT_5_MINI,
    KEY_PROMPT,
    KEY_RESPONSE,
    KEY_MESSAGES,
    KEY_ROLE,
    KEY_CONTENT,
    VALUE_USER,
    VALUE_TOOL,
    VALUE_AGENT,
    PROMPT_APPENDIX_NO_QUESTIONS,
    ENV_DOCUMENT_BASE_PATH,
    VALUE_DOCUMENT_BASE_PATH_DEFAULT,
)

from schema.process_graph_state_schema import ProcessGraphState

from factory.mcp_server_tool_factory import MCPServerToolFactory


logger = getLogger(__name__)


class ProcessGraph(StateGraph):
    """
    The ProcessGraph class.
    """

    state_schema: Type[Any] = ProcessGraphState

    agent: Any

    def __init__(
        self,
        data: dict = None,
    ) -> None:
        """
        Initialize the process graph.

        Args:
            session: The session to use.
            data: The data to use.

        Returns:
            None
        """
        super().__init__(self.state_schema)

        self.data = data

        self._build()

    async def stream(
        self,
        state: Union[dict[str, Any], Any] = None,
    ):
        """
        Stream the graph execution, yielding state updates.
        """
        logger.debug("Streaming the graph...")

        if state is None:
            state = self.data

        for key, _ in get_type_hints(self.state_schema).items():
            if key not in state:
                state[key] = None

        async for update in self.compile().astream(state, stream_mode="values"):
            yield update

    def _build(self) -> None:
        """
        Build the graph.

                   ╭─────────╮
                   │  START  │
                   ╰────┬────╯
                        │
                        v
                ╭───────────────╮
                │  entry_point  │
                ╰───────┬───────╯
                        │
                        v
               ╭──────────────────╮
               │  validate_state  │
               ╰────────┬─────────╯
                        │
                        v
                   ╭──────────╮
                   │  set_up  │
                   ╰────┬─────╯
                        │
                        v
                  ╭────────────╮
                  │  process   │
                  ╰─────┬──────╯
                        │
                        v
                 ╭──────────────╮
                 │  exit_point  │
                 ╰──────┬───────╯
                        │
                        v
                    ╭───────╮
                    │  END  │
                    ╰───────╯

        Returns:
            None
        """
        logger.debug("Creating the process graph.")

        self.add_node(NODE_ENTRY_POINT, self._entry_point)
        self.add_node(NODE_VALIDATE_STATE, self._validate_state)
        self.add_node(NODE_SET_UP, self._set_up)
        self.add_node(NODE_PROCESS, self._process)
        self.add_node(NODE_EXIT_POINT, self._exit_point)

        self.add_edge(START, NODE_ENTRY_POINT)
        self.add_edge(NODE_ENTRY_POINT, NODE_VALIDATE_STATE)
        self.add_edge(NODE_VALIDATE_STATE, NODE_SET_UP)
        self.add_edge(NODE_SET_UP, NODE_PROCESS)
        self.add_edge(NODE_PROCESS, NODE_EXIT_POINT)
        self.add_edge(NODE_EXIT_POINT, END)

        logger.debug("The process graph created.")

    # --------------------------------- Node functions ----------------------------------

    def _entry_point(
        self,
        state: Union[dict[str, Any], Any],
    ) -> Union[dict[str, Any], Any]:
        """
        Entry point node of the graph.

        Args:
            state (Union[dict[str, Any], Any]): The graph state.

        Returns:
            Union[dict[str, Any], Any]: The state after the node is run.
        """
        logger.debug("Entering the process graph.")

        return state

    def _validate_state(
        self,
        state: Union[dict[str, Any], Any],
    ) -> Union[dict[str, Any], Any]:
        """
        Validate the graph data.

        Args:
            state (Union[dict[str, Any], Any]): The state to validate.

        Returns:
            Union[dict[str, Any], Any]: The state after the node is run.

        Raises:
            ValueError: If the data is invalid.
        """
        logger.debug("Validating the graph data...")

        if not isinstance(state, dict):
            raise ValueError("Data provided to the process graph is not a valid dictionary.")

        if not state.get(KEY_PROMPT):
            raise ValueError("Prompt is required for the process graph.")

        logger.debug("Graph data validated.")

        return state

    async def _set_up(
        self,
        state: Union[dict[str, Any], Any],
    ) -> Union[dict[str, Any], Any]:
        """
        Set up the graph.

        Args:
            state (Union[dict[str, Any], Any]): The graph state.

        Returns:
            Union[dict[str, Any], Any]: The state after the node is run.
        """
        logger.debug("Setting up the graph...")

        # 1. Modify prompt to avoid additional questions.
        state[KEY_PROMPT] += PROMPT_APPENDIX_NO_QUESTIONS

        # 2. Set up MCP server tools and agent.
        document_base_path = os.getenv(ENV_DOCUMENT_BASE_PATH, VALUE_DOCUMENT_BASE_PATH_DEFAULT)
        tools = await MCPServerToolFactory.create(
            name="nutrient-dws",
            command="dws-mcp-wrapper.sh",
            args=["--sandbox", document_base_path],
        )

        self.agent = create_agent(
            model=MODEL_GPT_5_MINI,
            tools=tools,
        )

        logger.debug("Graph set up.")

        return state

    async def _process(
        self,
        state: Union[dict[str, Any], Any],
    ) -> Union[dict[str, Any], Any]:
        """
        Process node of the graph.

        Args:
            state (Union[dict[str, Any], Any]): The graph state.

        Returns:
            Union[dict[str, Any], Any]: The state after the node is run.
        """
        logger.debug("Processing documents...")

        prompt = state[KEY_PROMPT]

        response = await self.agent.ainvoke(
            {
                KEY_MESSAGES: [
                    {
                        KEY_ROLE: VALUE_USER,
                        KEY_CONTENT: prompt
                    }
                ]
            }
        )

        logger.debug("Processing completed.")

        for message in response[KEY_MESSAGES]:
            message_prefix = ""

            if message.type == VALUE_TOOL:
                message_prefix = "Tool used:"
            elif message.type == VALUE_AGENT:
                message_prefix = "Agent response:"

            state[KEY_RESPONSE] = f"{message_prefix} {message.content}"

        return state

    def _exit_point(
        self,
        state: Union[dict[str, Any], Any],
    ) -> Union[dict[str, Any], Any]:
        """
        Exit point node of the graph.

        Args:
            state (Union[dict[str, Any], Any]): The graph state.

        Returns:
            Union[dict[str, Any], Any]: The state after the node is run.
        """
        logger.debug("Exiting the process graph.")

        del state[KEY_PROMPT]

        gc.collect()

        return state
