from __future__ import annotations

# Create your models here.
"""
No models here by design. The dashboard is a read/aggregation layer over
data owned elsewhere (`users.User`, `users.OrganizerProfile` today; future
`events.Event`, `tickets.Ticket`, `payments.Payment`,
`notifications.Notification`, etc. once those apps exist) — it does not
own schema for any of that data itself.

Defining placeholder Ticket/Payment/Event/Notification models here would
create migration conflicts the moment the real owning apps are built
(Django does not expect two apps to claim overlapping tables), so
services.py returns plain `@dataclass(frozen=True)` result objects instead
of model instances wherever the underlying domain has no model yet. See
will eventually replace a placeholder.
"""
