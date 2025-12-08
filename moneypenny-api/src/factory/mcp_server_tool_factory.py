"""
Factory for creating MCP server tool instances.
"""

from logging import getLogger

import os

from typing import Any

from langchain_core.tools import BaseTool

from langchain_mcp_adapters.client import MultiServerMCPClient

from common.constants import (
    KEY_TRANSPORT,
    KEY_COMMAND,
    KEY_ARGS,
    KEY_ENV,
    TRANSPORT_STDIO,
)


logger = getLogger(__name__)


class MCPServerToolFactory:
    """
    Factory for creating MCP server tool instances.
    """

    CACHE = {}

    @classmethod
    async def create(
        cls,
        name: str,
        command: str,
        transport: str = TRANSPORT_STDIO,
        args: list[str] = None,
        env: dict[str, Any] = None,
    ) -> list[BaseTool]:
        """
        Create an MCP server tool instances.

        Args:
            name (str): Name of the MCP server.
            command (str): Command to run the MCP server.
            transport (str): Transport protocol (e.g., "stdio").
            args (list[str]): Arguments for the command.
            env (dict[str, Any]): Environment variables for the command.

        Returns:
            A list of BaseTool instances or None if creation fails.
        """
        logger.debug("Retrieving MCP server tool instance(s) for server: %s", name)

        if not cls.CACHE.get(name, None):
            logger.debug("Creating new MCP server tool instance(s) for server: %s", name)

            try:
                client = MultiServerMCPClient(
                    {
                        name: {
                            KEY_TRANSPORT: transport,
                            KEY_COMMAND: command,
                            KEY_ARGS: args or [],
                            KEY_ENV: env or os.environ.copy(),
                        }
                    }
                )

                tools = await client.get_tools()

                logger.debug("Successfully retrieved %d tools from MCP server.", len(tools))

                cls.CACHE[name] = tools
            except Exception as e: # pylint: disable=broad-except
                logger.error(
                    "Failed to retrieve MCP server tool instance(s) for server '%s': %s",
                    name, e, exc_info=True
                )
                logger.warning("Continuing without MCP tools...")

        tools = cls.CACHE.get(name, [])

        logger.debug(
            "Retrieved %1d MCP server tool %2s for server '%3s'.",
            len(tools), "instance" if len(tools) == 1 else "instances", name,
        )

        return tools

    
    @classmethod
    def clear_cache(cls) -> None:
        """
        Clear the cache of MCP server tools.

        This method clears the internal cache that stores MCP server tool instances,
        forcing the factory to create new instances on the next request.
        """
        logger.debug("Clearing the cache of MCP server tools...")

        cls.CACHE.clear()

        logger.debug("Cache of MCP server tools cleared.")
