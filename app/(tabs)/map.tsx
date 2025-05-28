// app/(tabs)/map.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, Dimensions, TextInput, Text,
    TouchableOpacity, FlatList, Image, ActivityIndicator, Animated,
    Easing, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';

import MapView, {
    Marker, Circle, PROVIDER_GOOGLE, Callout,
} from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import pubs from '../../data_mapa/localizaciones';
import mapaOscuro from '../../data_mapa/estilos_mapa/mapaOscuro';
import { Punto } from '../../data_mapa/types';
import { useNavigation } from '@react-navigation/native';

import fireAnim from '../../assets/animations/fire.json';
import iceAnim  from '../../assets/animations/ice.json';

const { width, height } = Dimensions.get('window');
const CHIP_CATEGORIES = ['Discoteca', 'Pub', 'Cafetería', 'Terraza', 'Azotea'];


/* ---------------- event info (desde offers.tsx) ------------------ */
interface EventInfo {
    name: string;
    aforo: number;
    occupied: number;
    genderRatio: { male: number; female: number };
    musicStyle: string;
    date: string;
}

const EVENT_DATA: Record<string, EventInfo> = {
    'Pub Delirium': { aforo: 200, occupied: 120, genderRatio:{male:65,female:35}, musicStyle:'Rock', date:'20 May 2025', name:'Pub Delirium' },
    'Delirium':     { aforo: 200, occupied: 120, genderRatio:{male:65,female:35}, musicStyle:'Rock', date:'20 May 2025', name:'Pub Delirium' },
    'Gaudi':        { aforo: 150, occupied: 85,  genderRatio:{male:50,female:50}, musicStyle:'Electrónica', date:'22 May 2025', name:'Gaudi' },
    'Don Vito':     { aforo: 100, occupied: 40,  genderRatio:{male:60,female:40}, musicStyle:'Variado', date:'24 May 2025', name:'Don Vito' },
    'Gavana':       { aforo: 300, occupied: 180, genderRatio:{male:70,female:30}, musicStyle:'Reggaeton / Comercial', date:'25 May 2025', name:'Gavana' },
    'Cafetería Uni':{ aforo: 80,  occupied: 70,  genderRatio:{male:45,female:55}, musicStyle:'Chill / Ambiente', date:'Hoy', name:'Cafetería Uni' },
};

/* ---------------- helpers ---------------- */
interface Friend   { id:string; name:string; gender:'M'|'F'; lat:number; lng:number }
interface CrowdDot { id:string;  lat:number; lng:number }

const puntos: Punto[] = pubs;
const NAMES_F = ['Lucía','Noa','María','Paula','Sara','Vera','Eva','Lola','Julia','Nerea'];
const NAMES_M = ['Hugo','Sergio','Álvaro','Leo','Pablo','Marc','Iñigo','Adrián','Ian','Gonzalo'];

const randomAround = (v:number, range=0.003) => v + (Math.random() - 0.5) * range;

/* amigos */
function makeFriends(userLat:number,userLng:number): Friend[] {
    const list:Friend[]=[];
    for(let i=0;i<3;i++){
        list.push({id:`fF${i}`,name:NAMES_F[i],gender:'F',lat:randomAround(userLat),lng:randomAround(userLng)});
        list.push({id:`fM${i}`,name:NAMES_M[i],gender:'M',lat:randomAround(userLat),lng:randomAround(userLng)});
    }
    return list;
}

/* crowd */
const CROWD_PER_PUB = 20, CITY_COUNT = 30;
function generateCrowd(region:{latitude:number;longitude:number}): CrowdDot[]{
    const dots:CrowdDot[]=[]; let id=0;
    pubs.forEach(p=>{
        [...Array(CROWD_PER_PUB)].forEach(()=>{
            const a=Math.random()*2*Math.PI, d=0.0008+Math.random()*0.0012;
            dots.push({id:`c${id++}`,lat:p.latitude+Math.cos(a)*d,lng:p.longitude+Math.sin(a)*d});
        });
    });
    [...Array(CITY_COUNT)].forEach(()=>dots.push({id:`c${id++}`,lat:randomAround(region.latitude,0.02),lng:randomAround(region.longitude,0.02)}));
    return dots;
}
const moveCrowd=(prev:CrowdDot[])=>prev.map(p=>({...p,lat:p.lat+(Math.random()-0.5)*0.0002,lng:p.lng+(Math.random()-0.5)*0.0002}));

/* ---------------- componente ---------------- */
export default function PantallaMapa(){
    const nav = useNavigation<any>();

    /* estado básico */
    const [region,setRegion]=useState<any>(null);  const [loading,setLoading]=useState(true);

    /* búsqueda/filtro */
    const [search,setSearch]=useState(''); const [selectedCategory,setSelectedCategory]=useState<string|null>(null);

    /* detalle */
    const [selectedPub,setSelectedPub]=useState<Punto|null>(null); const slideAnim=useRef(new Animated.Value(height)).current;

    /* Factio */
    const [factioOn,setFactioOn]=useState(false); const lottieRef=useRef<LottieView>(null);

    /* amigos & crowd */
    const [friends,setFriends]=useState<Friend[]>([]); const [crowd,setCrowd]=useState<CrowdDot[]>([]);

    /* chat */
    const [message,setMessage]=useState('');
    // Cambiamos el tipo de `balloons` para que solo contenga un posible mensaje.
    const [balloons,setBalloons]=useState<{id:string;text:string;lat:number;lng:number;op:Animated.Value}[]>([]);
    const currentBalloonOpacity = useRef(new Animated.Value(0)).current; // Ref para la opacidad del globo actual.


    const mapRef=useRef<MapView>(null);

    /* ubicación inicial */
    useEffect(()=>{(async()=>{
        const {status}=await Location.requestForegroundPermissionsAsync();
        if(status!=='granted'){setLoading(false);return;}
        const loc=await Location.getCurrentPositionAsync({});
        const R={latitude:loc.coords.latitude,longitude:loc.coords.longitude,latitudeDelta:0.05,longitudeDelta:0.05};
        setRegion(R); setFriends(makeFriends(R.latitude,R.longitude)); setLoading(false);
    })()},[]);

    /* crowd ON/OFF */
    useEffect(()=>{ if(region) factioOn?setCrowd(generateCrowd(region)):setCrowd([]); },[factioOn,region]);

    /* animar crowd y amigos */
    useEffect(()=>{ if(!factioOn) return; const id=setInterval(()=>{
        setCrowd(moveCrowd);
        setFriends(prev=>prev.map(f=>({...f,lat:randomAround(f.lat,0.0008),lng:randomAround(f.lng,0.0008)})));
    },3000); return()=>clearInterval(id);},[factioOn]);

    /* helpers */
    const centerOnUser=async()=>{
        const loc=await Location.getCurrentPositionAsync();
        mapRef.current?.animateToRegion({latitude:loc.coords.latitude,longitude:loc.coords.longitude,latitudeDelta:0.05,longitudeDelta:0.05},800);
    };

    const openDetail=(p:Punto)=>{ setSelectedPub(p); Animated.timing(slideAnim,{toValue:0,duration:300,useNativeDriver:true,easing:Easing.out(Easing.poly(4))}).start(); };
    const closeDetail=()=>Animated.timing(slideAnim,{toValue:height,duration:200,useNativeDriver:true}).start(()=>setSelectedPub(null));

    const sendMsg=()=>{
        if(!message.trim()||!region) return;

        const newBalloon = {
            id: Date.now().toString(),
            text: message,
            lat: region.latitude,
            lng: region.longitude,
            op: new Animated.Value(0) // Cada globo tiene su propia opacidad animada
        };

        // Si ya hay un globo, lo desvanecemos y luego lo reemplazamos.
        if (balloons.length > 0) {
            Animated.timing(balloons[0].op, {
                toValue: 0,
                duration: 200, // Duración para que el globo antiguo se desvanezca
                useNativeDriver: true,
            }).start(() => {
                setBalloons([newBalloon]); // Reemplaza el array con el nuevo globo
                Animated.timing(newBalloon.op, {
                    toValue: 1,
                    duration: 300, // Duración para que el nuevo globo aparezca
                    useNativeDriver: true,
                }).start();
            });
        } else {
            // Si no hay globos, simplemente lo añadimos y lo hacemos aparecer.
            setBalloons([newBalloon]);
            Animated.timing(newBalloon.op, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }

        setMessage('');
    };

    const pubsFiltrados=useMemo(()=>pubs.filter(p=>{
        if(selectedCategory && p.category!==selectedCategory) return false;
        if(search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }),[search,selectedCategory]);

    if(loading||!region) return(<View style={styles.loader}><ActivityIndicator size="large" color="#8A2BE2"/></View>);

    /* ---------- icono según categoría ---------- */
    const getMarkerEmoji=(cat:string)=>cat==='Discoteca'?'🪩':cat==='Cafeteria'?'🍻':cat==='Pub'?'🍸':'🍸';

    /* JSX */
    return(
        <View style={styles.container}>
            {/* MAPA */}
            <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={region} customMapStyle={mapaOscuro} showsUserLocation={true} showsMyLocationButton={false} rotateEnabled={false} onPanDrag={()=>{}}>
                {pubsFiltrados.map(p=><Circle key={`c${p.id}`} center={{latitude:p.latitude,longitude:p.longitude}} radius={p.weight} strokeWidth={0} fillColor="rgba(167,65,235,0.35)"/>)}
                {factioOn&&crowd.map(d=><Circle key={d.id} center={{latitude:d.lat,longitude:d.lng}} radius={Platform.OS==='ios'?15:20} strokeWidth={0} fillColor="rgba(255,105,180,0.15)"/>)}

                {pubsFiltrados.map(p=><Marker key={`p${p.id}`} coordinate={{latitude:p.latitude,longitude:p.longitude}} onPress={()=>openDetail(p)}>
                    <Text style={{fontSize:28}}>{getMarkerEmoji(p.category)}</Text></Marker>)}

                {factioOn&&friends.map(f=><Marker key={f.id} coordinate={{latitude:f.lat,longitude:f.lng}}>
                    <View style={{alignItems:'center'}}><Ionicons name="person" size={22} color={f.gender==='M'?'#00B5FF':'#FF5FCB'}/><Text style={styles.friendLabel}>{f.name}</Text></View>
                    <Callout tooltip><View style={styles.callout}><Text style={styles.calloutText}>{f.name}</Text></View></Callout>
                </Marker>)}

                {/* MODIFICACIÓN: Renderiza solo el primer (y único) globo en el array */}
                {factioOn && balloons.length > 0 && (
                    <Marker key={balloons[0].id} coordinate={{latitude:balloons[0].lat,longitude:balloons[0].lng}} anchor={{x:0.5,y:1}}>
                        <Animated.View style={[styles.balloon,{opacity:balloons[0].op}]}>
                            <Text style={styles.balloonText}>{balloons[0].text}</Text>
                        </Animated.View>
                    </Marker>
                )}
            </MapView>

            {/* búsqueda + chips */}
            <View style={styles.searchBar}><Ionicons name="search" size={18} color="#aaa" style={{margin:6}}/><TextInput style={{flex:1,color:'#fff'}} placeholder="Buscar..." placeholderTextColor="#aaa" value={search} onChangeText={setSearch}/></View>
            <View style={styles.chips}><FlatList horizontal data={CHIP_CATEGORIES} keyExtractor={i=>i} showsHorizontalScrollIndicator={false}
                                                 renderItem={({item})=>{
                                                     const active=selectedCategory===item;
                                                     return(<TouchableOpacity style={[styles.chip,active&&styles.chipActive]} onPress={()=>setSelectedCategory(prev=>prev===item?null:item)}><Text style={[styles.chipText,active&&styles.chipTextActive]}>{item}</Text></TouchableOpacity>);
                                                 }}/></View>
            <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}><Ionicons name="locate" size={24} color="#fff"/></TouchableOpacity>

            {/* botón Factio */}
            <TouchableOpacity style={styles.factioBtn} activeOpacity={0.8} onPress={()=>{
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setFactioOn(v=>!v);
                lottieRef.current?.reset();lottieRef.current?.play();
                // Opcional: Cuando el modo Factio se desactiva, borrar el globo del mensaje
                if (factioOn) setBalloons([]);
            }}>
                <LottieView ref={lottieRef} source={factioOn?fireAnim:iceAnim} loop autoPlay style={styles.factioAnim}/>
                <Text style={styles.factioBtnText}>{factioOn?'Modo Factio 😈🔥':'Modo Aburrido 💤'}</Text>
            </TouchableOpacity>

            {/* chat */}
            {factioOn&&<KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.chatBar}>
                <TextInput style={styles.chatInput} placeholder="Mensaje a colegas..." placeholderTextColor="#777" value={message} onChangeText={setMessage}/>
                <TouchableOpacity style={styles.chatIcon} onPress={sendMsg}><Ionicons name="send" size={18} color="#fff"/></TouchableOpacity>

            </KeyboardAvoidingView>}

            {/* detalle pub */}
            {selectedPub&&(
                <>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDetail}/>
                    <Animated.View style={[styles.sheet,{transform:[{translateY:slideAnim}]}]}>
                        <TouchableOpacity style={styles.sheetClose} onPress={closeDetail}><Ionicons name="close" size={22} color="#fff"/></TouchableOpacity>
                        {selectedPub.image&&<Image source={selectedPub.image} style={styles.sheetImg}/>}
                        <Text style={styles.sheetTitle}>{selectedPub.title}</Text>
                        <Text style={styles.sheetAddr}>{selectedPub.address}</Text>
                        {selectedPub.description&&<Text style={styles.sheetDesc}>{selectedPub.description}</Text>}

                        {/* eventos extra si Factio */}
                        {factioOn && EVENT_DATA[selectedPub.title] && (()=>{ const ev=EVENT_DATA[selectedPub.title]; const pct=ev.occupied/ev.aforo*100;
                            return(
                                <>
                                    <Text style={styles.evHeader}>🎟️ Evento ({ev.date})</Text>
                                    <View style={styles.statRow}><MaterialCommunityIcons name="account-group" size={18} color="#aaa"/><Text style={styles.statText}>{ev.occupied}/{ev.aforo}</Text></View>
                                    <View style={styles.barBg}><View style={[styles.barFill,{width:`${pct}%`}]} /></View>
                                    <View style={styles.statRow}><MaterialCommunityIcons name="gender-male" size={18} color="#4ea8de"/><Text style={styles.statText}>{ev.genderRatio.male}%</Text><MaterialCommunityIcons name="gender-female" size={18} color="#de4eae" style={{marginLeft:20}}/><Text style={styles.statText}>{ev.genderRatio.female}%</Text></View>
                                    <View style={styles.barBg}><View style={[styles.barFillMale,{width:`${ev.genderRatio.male}%`}]} /><View style={[styles.barFillFemale,{width:`${ev.genderRatio.female}%`}]} /></View>
                                    <Text style={styles.evDetail}>🎶 {ev.musicStyle}</Text>
                                </>
                            );
                        })()}

                        <View style={styles.sheetBtns}>
                            <TouchableOpacity style={styles.sheetBtn} onPress={()=>selectedPub?.mapUrl&&Linking.openURL(selectedPub.mapUrl)}><Ionicons name="navigate" size={18} color="#fff"/><Text style={styles.sheetBtnTx}>Cómo llegar</Text></TouchableOpacity>
                            {selectedPub.eventPageName&&<TouchableOpacity style={styles.sheetBtn} onPress={()=>nav.navigate(selectedPub.eventPageName)}><Ionicons name="calendar" size={18} color="#fff"/><Text style={styles.sheetBtnTx}>Eventos</Text></TouchableOpacity>}
                        </View>
                    </Animated.View>
                </>
            )}

            <StatusBar style="light"/>

        </View>

    );
}
/* ---------------- estilos ---------------- */
const styles=StyleSheet.create({
    container:{flex:1}, map:{width,height},
    loader:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'},

    searchBar:{position:'absolute',top:60,left:16,right:16,flexDirection:'row',alignItems:'center',backgroundColor:'rgba(0,0,0,0.65)',borderRadius:28,height:44,paddingRight:8},
    chips:{position:'absolute',top:112,left:0,right:0,paddingHorizontal:16},
    chip:{backgroundColor:'rgba(0,0,0,0.65)',paddingVertical:6,paddingHorizontal:14,borderRadius:20,marginRight:8},
    chipActive:{backgroundColor:'#8A2BE2'}, chipText:{color:'#eee',fontSize:14}, chipTextActive:{color:'#fff',fontWeight:'bold'},

    centerBtn:{position:'absolute',bottom:140,right:16,backgroundColor:'#8A2BE2',padding:14,borderRadius:30,elevation:5},

    factioBtn:{position:'absolute',bottom:80,alignSelf:'center',backgroundColor:'#000',borderRadius:30,paddingVertical:10,paddingHorizontal:22,overflow:'visible',elevation:6},
    factioAnim:{width:200,height:200,position:'absolute',left:-60,top:-60},
    factioBtnText:{color:'#fff',fontWeight:'bold'},

    chatBar:{position:'absolute',bottom:0,left:0,right:0,flexDirection:'row',alignItems:'center',padding:8,backgroundColor:'rgba(0,0,0,0.9)'},
    chatInput:{flex:1,backgroundColor:'rgba(255,255,255,0.1)',color:'#fff',paddingHorizontal:12,paddingVertical:8,borderRadius:20},
    chatIcon:{marginLeft:8,backgroundColor:'#8A2BE2',padding:10,borderRadius:20},

    friendLabel:{color:'#fff',fontSize:10,marginTop:-2},
    callout:{backgroundColor:'#0009',paddingHorizontal:8,paddingVertical:4,borderRadius:6}, calloutText:{color:'#fff',fontSize:12},

    balloon:{backgroundColor:'#8A2BE2',paddingHorizontal:12,paddingVertical:8,borderRadius:14,maxWidth:300,flexWrap:'wrap',alignSelf:'center'},
    balloonText:{color:'#fff',fontSize:13,flexWrap:'wrap'},

    sheet:{position:'absolute',left:0,right:0,bottom:0,backgroundColor:'#222',borderTopLeftRadius:20,borderTopRightRadius:20,padding:16,paddingTop:42, height: height * 0.55, flexDirection:'column'},
    sheetClose:{position:'absolute',right:16,top:12,padding:2},
    sheetImg:{width:'100%',height:280,borderRadius:12,marginBottom:12}, sheetTitle:{fontSize:22,fontWeight:'bold',color:'#fff'},
    sheetAddr:{fontSize:14,color:'#ccc',marginBottom:6}, sheetDesc:{fontSize:14,color:'#aaa',marginBottom:12},

    evHeader:{color:'#e14eca',fontWeight:'bold',marginTop:6},
    statRow:{flexDirection:'row',alignItems:'center',marginTop:4}, statText:{color:'#ddd',fontSize:12,marginLeft:6},
    barBg:{width:'100%',height:6,backgroundColor:'#333',borderRadius:3,overflow:'hidden',marginTop:4},
    barFill:{height:'100%',backgroundColor:'#e14eca'},
    barFillMale:{height:'100%',backgroundColor:'#4ea8de',position:'absolute',left:0},
    barFillFemale:{height:'100%',backgroundColor:'#de4eae',position:'absolute',right:0},
    evDetail:{color:'#ccc',fontSize:13,marginTop:6},

    sheetBtns:{flexDirection:'row',justifyContent:'space-between',marginTop:12},
    sheetBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#8A2BE2',padding:12,borderRadius:8,marginHorizontal:4},
    sheetBtnTx:{color:'#fff',marginLeft:6,fontSize:14},
});