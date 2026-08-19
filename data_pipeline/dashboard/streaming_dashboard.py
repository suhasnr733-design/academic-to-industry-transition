# data_pipeline/dashboard/streaming_dashboard.py

import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.graph_objs as go
from plotly.subplots import make_subplots
from collections import deque
import pandas as pd
import random
import time
from datetime import datetime

class StreamingDashboard:
    """Real-time streaming dashboard"""
    
    def __init__(self):
        self.app = dash.Dash(__name__)
        self.data_buffer = deque(maxlen=1000)
        self.time_buffer = deque(maxlen=1000)
        self.setup_layout()
        self.setup_callbacks()
    
    def setup_layout(self):
        """Setup dashboard layout"""
        self.app.layout = html.Div([
            html.H1("📊 Real-time Data Pipeline Dashboard", 
                   style={'text-align': 'center', 'margin': '20px'}),
            
            html.Div([
                # Metrics cards
                html.Div([
                    html.Div([
                        html.H3("Total Events", style={'margin': '0'}),
                        html.H2(id="total-events", children="0", 
                               style={'color': '#3b82f6', 'margin': '10px 0'})
                    ], className="metric-card"),
                    
                    html.Div([
                        html.H3("Throughput", style={'margin': '0'}),
                        html.H2(id="throughput", children="0/s", 
                               style={'color': '#10b981', 'margin': '10px 0'})
                    ], className="metric-card"),
                    
                    html.Div([
                        html.H3("Errors", style={'margin': '0'}),
                        html.H2(id="errors", children="0", 
                               style={'color': '#ef4444', 'margin': '10px 0'})
                    ], className="metric-card"),
                    
                    html.Div([
                        html.H3("Avg Latency", style={'margin': '0'}),
                        html.H2(id="avg-latency", children="0ms", 
                               style={'color': '#8b5cf6', 'margin': '10px 0'})
                    ], className="metric-card")
                ], style={'display': 'grid', 'grid-template-columns': 'repeat(4, 1fr)', 
                         'gap': '20px', 'margin': '20px'}),
                
                # Charts
                html.Div([
                    dcc.Graph(id="events-graph", config={'displayModeBar': False}),
                ], style={'width': '100%', 'height': '400px'}),
                
                html.Div([
                    dcc.Graph(id="throughput-graph", config={'displayModeBar': False}),
                ], style={'width': '100%', 'height': '300px'}),
                
                # Interval for updates
                dcc.Interval(id='interval-component', interval=1000, n_intervals=0)
            ])
        ], style={'padding': '20px', 'font-family': 'Arial, sans-serif'})
    
    def setup_callbacks(self):
        """Setup dashboard callbacks"""
        @self.app.callback(
            [Output('events-graph', 'figure'),
             Output('throughput-graph', 'figure'),
             Output('total-events', 'children'),
             Output('throughput', 'children'),
             Output('errors', 'children'),
             Output('avg-latency', 'children')],
            [Input('interval-component', 'n_intervals')]
        )
        def update_dashboard(n):
            # Generate sample data
            events = random.randint(10, 50)
            throughput = random.randint(50, 200)
            errors = random.randint(0, 5)
            latency = random.randint(10, 100)
            
            self.data_buffer.append(events)
            self.time_buffer.append(datetime.now())
            
            # Create events graph
            events_fig = go.Figure()
            events_fig.add_trace(go.Scatter(
                x=list(self.time_buffer),
                y=list(self.data_buffer),
                mode='lines+markers',
                name='Events',
                line=dict(color='#3b82f6', width=2),
                marker=dict(size=4)
            ))
            events_fig.update_layout(
                title='Real-time Events',
                xaxis_title='Time',
                yaxis_title='Events',
                template='plotly_white',
                hovermode='x unified'
            )
            
            # Create throughput graph
            throughput_fig = go.Figure()
            throughput_fig.add_trace(go.Bar(
                x=list(self.time_buffer)[-20:],
                y=[random.randint(50, 200) for _ in range(20)],
                name='Throughput',
                marker=dict(color='#10b981')
            ))
            throughput_fig.update_layout(
                title='Throughput (events/sec)',
                xaxis_title='Time',
                yaxis_title='Throughput',
                template='plotly_white',
                hovermode='x unified'
            )
            
            return (events_fig, throughput_fig, 
                   str(len(self.data_buffer)), 
                   f"{throughput}/s", 
                   str(errors), 
                   f"{latency}ms")
    
    def run(self, host='0.0.0.0', port=8051):
        """Run the dashboard"""
        self.app.run_server(host=host, port=port, debug=False)

# Generate sample data function
def generate_sample_data():
    """Generate sample streaming data"""
    while True:
        yield {
            'timestamp': datetime.now().isoformat(),
            'event_type': random.choice(['upload', 'process', 'match', 'view']),
            'user_id': random.randint(1, 1000),
            'value': random.randint(10, 100),
            'duration': random.randint(100, 500),
            'success': random.random() > 0.05
        }
        time.sleep(0.1)