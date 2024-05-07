import wb.models as m

from .schemas import TeamHierarchy

__all__ = ('build_team_hierarchy',)


def build_team_hierarchy(teams: list[m.Team]) -> list[TeamHierarchy]:
    hierarchy: TeamHierarchy = {
        'name': '',
        'attributes': {
            'id': None,
            'manager': None,
        },
        'children': [],
    }
    teams_map = {team.id: team for team in teams}

    def add_children(parent_node):
        team = teams_map.get(parent_node['attributes']['id'])
        if not team:
            return
        for child_team in team.sub_teams:
            child_node = {
                'name': child_team.name,
                'attributes': {
                    'id': child_team.id,
                    'manager': child_team.manager,
                },
                'children': [],
            }
            parent_node['children'].append(child_node)
            add_children(child_node)

    for team in teams:
        if not team.head_team_id:
            root_node = {
                'name': team.name,
                'attributes': {
                    'id': team.id,
                    'manager': team.manager,
                },
                'children': [],
            }
            hierarchy['children'].append(root_node)
            add_children(root_node)

    return hierarchy
