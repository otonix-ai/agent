"""Example skill template for Otonix Agent

Extend the agent with custom capabilities by creating new skills.
Each skill should have a name, description, and execute method.
"""


class ExampleSkill:
    """Example skill that demonstrates the skill pattern"""
    
    name = "example_skill"
    description = "Example skill that shows how to extend the agent"
    
    def execute(self, **kwargs):
        """Execute the skill
        
        Args:
            **kwargs: Skill parameters
            
        Returns:
            dict: Execution results with 'success' boolean and 'data' content
        """
        try:
            # Your skill implementation here
            result = {
                "message": "Example skill executed",
                "timestamp": self._get_timestamp()
            }
            
            return {
                "success": True,
                "data": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def _get_timestamp():
        """Get current ISO timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


# Example of creating a custom skill - uncomment to use
class SystemMonitorSkill:
    """Monitor system resources (CPU, memory, disk)"""
    
    name = "system_monitor"
    description = "Monitor server CPU, memory, and disk usage"
    
    def execute(self, **kwargs):
        """Gather system statistics
        
        Returns:
            dict: System stats
        """
        try:
            import psutil
            
            return {
                "success": True,
                "data": {
                    "cpu_percent": psutil.cpu_percent(interval=1),
                    "memory": {
                        "percent": psutil.virtual_memory().percent,
                        "available_gb": psutil.virtual_memory().available / (1024 ** 3)
                    },
                    "disk": {
                        "percent": psutil.disk_usage("/").percent,
                        "free_gb": psutil.disk_usage("/").free / (1024 ** 3)
                    }
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
