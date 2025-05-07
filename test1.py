import dash
from dash import html, dcc
from dash.dependencies import Input, Output, State
import plotly.graph_objs as go
import networkx as nx
import random
import json

# === 1. Generate Large Graph ===
G = nx.barabasi_albert_graph(n=40, m=3)

# Add node attributes
for node in G.nodes():
    G.nodes[node]['status'] = 'healthy'
    G.nodes[node]['mortality'] = random.uniform(0.01, 0.2)
    G.nodes[node]['days_infected'] = 0

# Add edge weights
for u, v in G.edges():
    G.edges[u, v]['weight'] = random.uniform(0.1, 1.0)

# Infect a few nodes initially
initial_infected = random.sample(list(G.nodes), 10)
for node in initial_infected:
    G.nodes[node]['status'] = 'infected'

# Generate layout positions once and store in node attributes
pos = nx.spring_layout(G, seed=42, k=0.02)
for node in G.nodes():
    G.nodes[node]['x'] = pos[node][0]
    G.nodes[node]['y'] = pos[node][1]

# === 2. Visualization Helpers ===
def get_node_color(status):
    return {
        'healthy': 'green',
        'infected': 'red',
        'recovered': 'blue',
        'dead': 'gray'
    }[status]

def graph_to_figure(G):
    edge_x, edge_y = [], []
    for u, v in G.edges():
        x0, y0 = G.nodes[u]['x'], G.nodes[u]['y']
        x1, y1 = G.nodes[v]['x'], G.nodes[v]['y']
        edge_x += [x0, x1, None]
        edge_y += [y0, y1, None]

    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=0.2, color='#888'),
        hoverinfo='none',
        mode='lines'
    )

    node_x, node_y, node_color = [], [], []
    for node in G.nodes():
        node_x.append(G.nodes[node]['x'])
        node_y.append(G.nodes[node]['y'])
        node_color.append(get_node_color(G.nodes[node]['status']))

    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers',
        hoverinfo='text',
        marker=dict(
            color=node_color,
            size=4,
            line_width=0
        )
    )

    fig = go.Figure(data=[edge_trace, node_trace],
                    layout=go.Layout(
                        title='Infectious Disease Simulation',
                        showlegend=False,
                        hovermode='closest',
                        margin=dict(b=0, l=0, r=0, t=30),
                        xaxis=dict(showgrid=False, zeroline=False),
                        yaxis=dict(showgrid=False, zeroline=False),
                    ))
    return fig

# === 3. Disease Update Logic ===
def update_infection(G):
    newly_infected = []
    for node in list(G.nodes()):
        status = G.nodes[node]['status']
        if status == 'infected':
            G.nodes[node]['days_infected'] += 1

            # Death condition
            if random.random() < G.nodes[node]['mortality'] * 0.01:
                G.nodes[node]['status'] = 'dead'
                continue

            # Recovery condition
            if G.nodes[node]['days_infected'] > 10:
                G.nodes[node]['status'] = 'recovered'
                continue

            for neighbor in G.neighbors(node):
                if G.nodes[neighbor]['status'] == 'healthy':
                    weight = G.edges[node, neighbor]['weight']
                    if random.random() < weight * 0.3:
                        newly_infected.append(neighbor)

    for node in newly_infected:
        if G.nodes[node]['status'] == 'healthy':
            G.nodes[node]['status'] = 'infected'

    return G

# === 4. Dash App ===
app = dash.Dash(__name__)
server = app.server

# Store graph as JSON once
stored_data = nx.readwrite.json_graph.node_link_data(G, edges='links')

app.layout = html.Div([
    html.H2("Infection Spread Simulation", style={"textAlign": "center"}),
    dcc.Graph(id='network-graph'),
    dcc.Interval(id='interval-component', interval=1000, n_intervals=0),
    dcc.Store(id='graph-store', data=stored_data)
])

# === 5. Callback ===
@app.callback(
    Output('network-graph', 'figure'),
    Output('graph-store', 'data'),
    Input('interval-component', 'n_intervals'),
    State('graph-store', 'data')
)
def update_graph(n, data):
    G = nx.readwrite.json_graph.node_link_graph(data, edges='links')

    # Reapply layout coordinates (not recalculated)
    for node in G.nodes():
        G.nodes[node]['x'] = data['nodes'][node]['x']
        G.nodes[node]['y'] = data['nodes'][node]['y']

    G = update_infection(G)
    fig = graph_to_figure(G)

    new_data = nx.readwrite.json_graph.node_link_data(G, edges='links')
    return fig, new_data

# === 6. Run ===
if __name__ == '__main__':
    app.run(debug=True)
