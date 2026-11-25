/*
 * The course glossary: one list of AUTOSAR terms with a one-line meaning. It feeds
 *   - the hover help on every page: <code class="term">CanNm_NetworkRequest</code> or
 *     <span class="term">ComM user</span> shows the meaning on hover, focus or tap. The text is looked
 *     up (case does not matter, a trailing plural "s" is ignored); data-term="..." looks up another key.
 *   - reference/words.html, which lists every entry.
 * A term marked in a page but missing here is reported in the console.
 * Each entry: t = term, also = other spellings that find it, m = meaning, l = lessons that teach it.
 * Note: the lookup ignores case, so "NM" (network management) and the module abbreviation "Nm" are one
 * key. The course calls the module NmIf.
 */
(function () {
  const TERMS = [
    // Part 1. The big picture
    { t: 'ECU', m: 'Electronic Control Unit: one control unit in the vehicle, with its microcontroller, its software and its connections to one or more buses.', l: [1] },
    { t: 'BSW', also: ['basic software'], m: 'Basic software: the standardized modules below the RTE (drivers, interfaces, services such as ComM, EcuM, BswM and NM).', l: [1] },
    { t: 'bus', also: ['network'], m: 'A communication medium several ECUs share, such as a CAN bus or an Ethernet network. AUTOSAR calls one of them a physical channel or network.', l: [1] },
    { t: 'network management', also: ['NM'], m: 'The coordination between ECUs on one bus that decides when the bus may go to sleep: every ECU that still needs the bus keeps sending NM PDUs; when none is left, all sleep together.', l: [1, 12] },
    { t: 'mode management', m: 'Deciding which mode the ECU and its communication are in (starting up, running, communicating, going to sleep, off) and switching the modules accordingly.', l: [1] },
    { t: 'wakeup', also: ['wake-up'], m: 'The event that ends a sleep: a message on the bus, a pin, a timer. It brings the ECU, or a sleeping bus, back to work.', l: [1, 33] },
    { t: 'bus sleep', m: 'A bus on which no ECU communicates any more; controllers and transceivers are in a low-power mode and only a wakeup brings the bus back.', l: [1] },
    { t: 'ComM', also: ['Communication Manager'], m: 'Communication Manager: collects the communication requests of its users and sets the communication mode of each channel (no, silent or full communication).', l: [1, 5] },
    { t: 'EcuM', also: ['ECU State Manager', 'ECU Manager'], m: 'ECU State Manager: initializes the ECU at startup, handles wakeup sources and their validation, and carries out shutdown and sleep.', l: [1, 25] },
    { t: 'BswM', also: ['BSW Mode Manager'], m: 'BSW Mode Manager: evaluates mode requests and mode indications from many modules with configured rules and runs the matching actions (start communication, switch I-PDU groups, shut down, ...).', l: [1, 27] },
    { t: 'SWC', also: ['software component'], m: 'Software component: application software above the RTE.', l: [1] },
    { t: 'RTE', m: 'Runtime Environment: connects the SWCs to each other and to the basic software, for example to the ports of ComM.', l: [1] },

    // The modules and their layers
    { t: 'NmIf', also: ['Nm Interface', 'Network Management Interface', 'Generic Network Management Interface'], m: 'Network Management Interface (module abbreviation Nm): the adaptation layer between ComM and the bus-specific NM modules; it also coordinates several networks (NM coordinator) and aggregates PNC requests.', l: [2, 19] },
    { t: 'CanNm', also: ['CAN Network Management'], m: 'CAN Network Management: the bus-specific NM module for CAN; sends and receives NM PDUs and runs the NM state machine of one CAN network.', l: [2, 13] },
    { t: 'UdpNm', also: ['UDP Network Management'], m: 'UDP Network Management: the bus-specific NM module for Ethernet; the same algorithm as CanNm, with NM PDUs carried in UDP.', l: [2, 20] },
    { t: 'bus state manager', also: ['BusSM'], m: 'The module that turns a communication mode of ComM into the states of controllers and transceivers of one bus: CanSM, EthSM, FrSM, LinSM.', l: [2, 21] },
    { t: 'CanSM', also: ['CAN State Manager'], m: 'CAN State Manager: switches the CAN controllers and transceivers of a CAN network on and off for ComM and handles bus-off recovery.', l: [2, 21] },
    { t: 'EthSM', also: ['Ethernet State Manager'], m: 'Ethernet State Manager: switches an Ethernet network on and off for ComM, through EthIf and TcpIp, and watches the link state.', l: [2, 23] },
    { t: 'CanIf', also: ['CAN Interface'], m: 'CAN Interface: hands L-PDUs between the upper modules and the CAN driver, controls controller and transceiver modes, and detects and validates CAN wakeups.', l: [2] },
    { t: 'EthIf', also: ['Ethernet Interface'], m: 'Ethernet Interface: hands Ethernet frames between TcpIp and the Ethernet driver, and controls controller, transceiver and switch modes.', l: [2] },
    { t: 'CanTrcv', also: ['CAN transceiver', 'CAN Transceiver Driver', 'transceiver'], m: 'CAN Transceiver Driver: controls the transceiver chip between the CAN controller and the bus wires: its operation mode (normal, standby, sleep), its wakeup detection and, if supported, selective wakeup.', l: [2, 43] },
    { t: 'Can driver', also: ['Can'], m: 'CAN Driver: controls the CAN controller in the microcontroller (started, stopped, sleep) and sends and receives frames.', l: [2] },
    { t: 'TcpIp', m: 'The TCP/IP stack module: IP, UDP, TCP, ARP and the sockets used by SoAd; EthSM switches it online and offline (TcpIp_RequestComMode).', l: [2, 24] },
    { t: 'Dcm', also: ['Diagnostic Communication Manager'], m: 'Diagnostic Communication Manager: handles diagnostic requests from a tester; it keeps a channel awake while diagnostics is active.', l: [2, 10] },
    { t: 'COM', m: 'Communication module: carries signals in I-PDUs between the RTE and the PduR (see the COM course); BswM switches its I-PDU groups on and off.', l: [2] },
    { t: 'PduR', also: ['PDU Router'], m: 'PDU Router: forwards I-PDUs between upper modules (COM, Dcm) and the bus interfaces (in R25-11 on CAN through the LSduR).', l: [2] },
    { t: 'I-PDU', also: ['PDU'], m: 'Interaction layer Protocol Data Unit: a block of data (such as a group of signals) handed between COM, PduR and the bus interfaces.', l: [2] },
    { t: 'I-PDU group', m: 'A set of I-PDUs that COM starts and stops together; a BswM rule can switch them when a channel enters or leaves full communication.', l: [2, 9] },
    { t: 'DEM', m: 'Diagnostic Event Manager: stores diagnostic events and errors, such as a bus-off reported by CanSM.', l: [22] },
    { t: 'Det', m: 'Default Error Tracer: receives the development and runtime errors that modules report.', l: [2] },
    { t: 'main function', m: 'A function of a module that the scheduler calls cyclically; timers and state machines of ComM, NM, CanSM and EcuM advance in it.', l: [4] },

    // The example ECU
    { t: 'gateway', m: 'An ECU connected to several buses that passes data between them and, for network management, keeps them awake together (see NM coordinator).', l: [3, 37] },
    { t: 'partial networking', also: ['PN'], m: 'Letting only part of the ECUs on a bus wake up and communicate, grouped in partial network clusters, while the others keep sleeping.', l: [3, 40] },
    { t: 'PNC', also: ['partial network cluster'], m: 'Partial network cluster: a group of ECUs (and their users) that are switched on and off together, identified by one bit in the PNC bit vector of the NM PDU.', l: [3, 40] },

    // Part 2. ComM
    { t: 'ComM user', also: ['user'], m: 'A logical requester of communication in ComM (for example an SWC function); it is mapped statically to one or more channels or to one or more PNCs (not both for the same channel) and requests full or no communication.', l: [5] },
    { t: 'channel', also: ['ComM channel', 'physical channel'], m: 'In ComM, one network the ECU is connected to (one CAN network, one Ethernet network), identified by a network handle; ComM runs one state machine per channel.', l: [5] },
    { t: 'communication mode', also: ['ComM mode'], m: 'The mode ComM requests for a channel: COMM_NO_COMMUNICATION, COMM_SILENT_COMMUNICATION or COMM_FULL_COMMUNICATION.', l: [5, 6] },
    { t: 'ComM_RequestComMode', m: 'The ComM API with which a ComM user requests a communication mode (full or no communication) for its channels.', l: [5] },
    { t: 'COMM_NO_COMMUNICATION', also: ['NO_COMMUNICATION'], m: 'Communication mode and state: the channel neither sends nor receives.', l: [5, 6] },
    { t: 'COMM_SILENT_COMMUNICATION', also: ['SILENT_COMMUNICATION'], m: 'Communication mode and state: the channel receives but does not send; used on the way from full to no communication.', l: [5, 6] },
    { t: 'COMM_FULL_COMMUNICATION', also: ['FULL_COMMUNICATION'], m: 'Communication mode and state: the channel sends and receives.', l: [5, 6] },
    { t: 'COMM_NO_COM_NO_PENDING_REQUEST', m: 'Sub-state of COMM_NO_COMMUNICATION: no full communication is requested for the channel.', l: [6] },
    { t: 'COMM_NO_COM_REQUEST_PENDING', m: 'Sub-state of COMM_NO_COMMUNICATION: full communication is wanted (user request, wakeup or active diagnostics), but ComM waits until communication is allowed.', l: [6] },
    { t: 'COMM_FULL_COM_NETWORK_REQUESTED', m: 'Sub-state of COMM_FULL_COMMUNICATION: a ComM user or Dcm needs the channel (or, without NM, the minimum full-communication time runs), so ComM requests the network from NM (or starts it passively after a wakeup).', l: [6, 7] },
    { t: 'COMM_FULL_COM_READY_SLEEP', m: 'Sub-state of COMM_FULL_COMMUNICATION: no local need any more; ComM has released the network and waits for NM to let the bus sleep.', l: [6, 7] },
    { t: 'NM variant', also: ['ComMNmVariant'], m: 'How a ComM channel is handled by NM: FULL, PASSIVE, LIGHT, NONE, SLAVE_ACTIVE or SLAVE_PASSIVE.', l: [8] },
    { t: 'FULL', m: 'NM variant: AUTOSAR NM runs on the channel and ComM requests and releases the network through it.', l: [8] },
    { t: 'PASSIVE', m: 'NM variant: AUTOSAR NM runs in passive mode; ComM never requests the network, so the ECU cannot keep the bus awake and goes down with the others.', l: [8] },
    { t: 'LIGHT', m: 'NM variant: no NM on the channel; after the last release ComM waits a configured time, then switches the channel off.', l: [8] },
    { t: 'NONE', m: 'NM variant: no NM; once requested, the channel stays in full communication (COMM_FULL_COM_READY_SLEEP after the last release) until the power of the ECU is switched off.', l: [8] },
    { t: 'SLAVE_ACTIVE', m: 'NM variant for a slave channel (for example LIN): the ECU may request communication; the master decides about sleep.', l: [8] },
    { t: 'SLAVE_PASSIVE', m: 'NM variant for a slave that always follows its master (for example an Ethernet channel with OA TC10 compliant hardware); no ComM user or PNC may reference it.', l: [8] },
    { t: 'communication allowed', m: 'A flag per channel set by BswM through ComM_CommunicationAllowed; ComM leaves COMM_NO_COMMUNICATION only while it is TRUE.', l: [9] },
    { t: 'ComM_DCM_ActiveDiagnostic', m: 'Called by Dcm when diagnostics on a channel becomes active (and with every request while it stays active); on FULL, LIGHT and NONE channels ComM treats it like a request for full communication.', l: [10] },
    { t: 'ComM_DCM_InactiveDiagnostic', m: 'Called by Dcm when diagnostics on a channel ends; ComM may release the channel again.', l: [10] },
    { t: 'communication inhibition', also: ['inhibition'], m: 'ComM functions that stop requests from waking or keeping a channel: wake up inhibition and limit to COMM_NO_COMMUNICATION.', l: [11] },
    { t: 'wake up inhibition', m: 'Inhibition that keeps requests for full communication but does not execute them while the channel is in no or silent communication, so they do not wake the bus.', l: [11] },
    { t: 'limit to COMM_NO_COMMUNICATION', also: ['limit to NoCom', 'mode limitation'], m: 'Inhibition that takes an actively requested channel down to no communication and ignores (and then clears) all requests for full communication.', l: [11] },
    { t: 'ECU group classification', m: 'A bit field per ECU that enables wake up inhibition (bit 0) and limit to COMM_NO_COMMUNICATION (bit 1); changeable at run time.', l: [11] },
    { t: 'Inhibited Full Communication Request Counter', also: ['inhibition counter'], m: 'Counts the requests for full communication that ComM rejected because of inhibition.', l: [11] },

    // Part 3. Network management
    { t: 'NM PDU', also: ['NM message', 'NM-PDU'], m: 'The network management message each ECU sends cyclically while it needs the bus: Source Node Identifier, Control Bit Vector, optional user data and PNC bit vector.', l: [12, 15] },
    { t: 'Network Mode', m: 'The CanNm and UdpNm mode in which the network is awake; it has three states: Repeat Message State, Normal Operation State and Ready Sleep State.', l: [13] },
    { t: 'Repeat Message State', m: 'State of Network Mode: the ECU sends NM PDUs for at least the Repeat Message Time, so that every node sees it; entered on wakeup or on request.', l: [13] },
    { t: 'Normal Operation State', m: 'State of Network Mode: the ECU needs the network and keeps sending NM PDUs.', l: [13] },
    { t: 'Ready Sleep State', m: 'State of Network Mode: the ECU no longer needs the network and stops sending, but stays awake while other ECUs still send NM PDUs.', l: [13] },
    { t: 'Prepare Bus-Sleep Mode', m: 'CanNm and UdpNm mode after the NM-Timeout Time ran out in Ready Sleep: no more communication; after the Wait Bus-Sleep Time the bus sleeps.', l: [13] },
    { t: 'Bus-Sleep Mode', m: 'CanNm and UdpNm mode in which the bus sleeps; a network request or a passive startup starts Network Mode again, a received NM PDU is only reported with Nm_NetworkStartIndication.', l: [13] },
    { t: 'NM-Timeout Time', also: ['NM-Timeout Timer', 'NM timeout'], m: 'NM timer: started on entering Network Mode and restarted with every NM PDU sent or received; when it runs out in Ready Sleep State the node enters Prepare Bus-Sleep Mode, in the other states it is restarted and a runtime error is reported.', l: [14] },
    { t: 'Repeat Message Time', m: 'NM timer: how long a node stays in Repeat Message State.', l: [14] },
    { t: 'Wait Bus-Sleep Time', m: 'NM timer: how long Prepare Bus-Sleep Mode lasts before Bus-Sleep Mode, so that every node finishes its last activities.', l: [14] },
    { t: 'Message Cycle Time', m: 'NM timer: the period with which a node sends NM PDUs while it is in Repeat Message or Normal Operation State.', l: [14] },
    { t: 'immediate transmission', also: ['immediate NM transmission'], m: 'A burst of a configured number of NM PDUs with a short cycle of its own, sent when the network is actively requested in Bus-Sleep or Prepare Bus-Sleep Mode; afterwards the Message Cycle Time applies.', l: [14] },
    { t: 'Source Node Identifier', also: ['SNI', 'node identifier'], m: 'NM PDU byte that carries the node identifier of the sending ECU.', l: [15] },
    { t: 'Control Bit Vector', also: ['CBV'], m: 'NM PDU byte of control bits: Repeat Message Request, PN Shutdown Request, NM Coordinator Sleep Ready, Active Wakeup, Partial Network Learning and Partial Network Information (bits 2 and 7 reserved).', l: [15, 57] },
    { t: 'user data', also: ['NM user data'], m: 'Bytes of the NM PDU that the application fills through COM or the NM API (not both); NM itself does not interpret them. Received user data can only be read through the NM API.', l: [15, 18] },
    { t: 'PNC bit vector', m: 'The bytes of the NM PDU that carry one bit per PNC: 1 means the sender requests that PNC.', l: [15, 40] },
    { t: 'Repeat Message Request', also: ['Repeat Message Bit', 'Repeat Message Request Bit'], m: 'CBV bit that makes every node in Normal Operation or Ready Sleep State go to Repeat Message State (with node detection enabled); used for node detection.', l: [16] },
    { t: 'node detection', m: 'Finding out which nodes are on the bus: a node sets the Repeat Message Request, all nodes go to Repeat Message State and send, and each sender is seen by its Source Node Identifier. Not possible for passive nodes.', l: [16] },
    { t: 'passive mode', m: 'An NM configuration in which the node never sends NM PDUs: it can be woken and kept awake, but it never keeps the bus awake itself.', l: [17] },
    { t: 'communication control', m: 'Switching off NM PDU transmission on a channel without leaving Network Mode (NM-Timeout Timer and remote sleep detection stop too); requested by Dcm\'s CommunicationControl service through BswM, which calls Nm_DisableCommunication.', l: [17] },
    { t: 'bus load reduction', m: 'An optional CanNm mechanism in Normal Operation State: a received NM PDU restarts each node\'s message cycle with its node-specific reduced time, so only the two nodes with the smallest reduced times send. Not specified for UdpNm.', l: [17] },
    { t: 'Remote Sleep Indication', m: 'Notification that, while this node still needs the network, no other node has sent an NM PDU for the Remote Sleep Indication Time: the others are ready to sleep.', l: [18] },
    { t: 'car wakeup', m: 'An optional NM feature: a received NM PDU with the car wakeup bit (at a configured position in the user data) set is reported with Nm_CarWakeUpIndication; NmIf passes it to a callout or BswM, which can wake other networks.', l: [18] },
    { t: 'state change notification', m: 'An optional NM feature: CanNm/UdpNm report each change of their state (Nm_StateChangeNotification); NmIf passes it to BswM and optionally writes a COM signal.', l: [18] },
    { t: 'NM coordinator', also: ['coordinator'], m: 'NmIf functionality on a gateway that keeps several networks awake together and shuts them down so that they reach bus sleep at the same time.', l: [19, 37] },
    { t: 'Nm_NetworkRequest', m: 'NmIf API called by ComM to request the network: NM starts (or keeps) sending NM PDUs. It is passed on as CanNm_NetworkRequest or UdpNm_NetworkRequest.', l: [19] },
    { t: 'Nm_NetworkRelease', m: 'NmIf API called by ComM to release the network: NM stops sending and lets the bus sleep once no other node needs it.', l: [19] },
    { t: 'Nm_PassiveStartUp', m: 'NmIf API that starts NM in Network Mode without requesting the network, for example after a wakeup by another ECU. For a channel of an NM coordination cluster NmIf treats it as a network request and calls <Bus>Nm_NetworkRequest.', l: [19, 36] },
    { t: 'CanNm_NetworkRequest', m: 'CanNm API called by NmIf to request the CAN network.', l: [19] },
    { t: 'UdpNm_NetworkRequest', m: 'UdpNm API called by NmIf to request the Ethernet network.', l: [20] },

    // Part 4. Bus state managers
    { t: 'CAN controller', also: ['controller'], m: 'The CAN hardware unit in the microcontroller; the CAN driver puts it into the states STARTED, STOPPED and SLEEP.', l: [21] },
    { t: 'bus-off', m: 'A CAN controller state after too many transmission errors: it disconnects from the bus. CanSM tries to recover it.', l: [22] },
    { t: 'bus-off recovery', m: 'CanSM restarts the controller after a bus-off, first quickly (level 1), then more slowly (level 2), and reports the event to DEM.', l: [22] },
    { t: 'link state', m: 'Whether an Ethernet transceiver (or switch port) has a working connection to its link partner: ETHTRCV_LINK_STATE_ACTIVE or DOWN. EthIf polls it and reports changes to EthSM.', l: [23] },
    { t: 'EthTrcv', also: ['Ethernet transceiver'], m: 'Ethernet Transceiver Driver: controls the PHY chip between the Ethernet controller and the cable, including its link state and wakeup.', l: [2, 23] },
    { t: 'SoAd', also: ['Socket Adaptor'], m: 'Socket Adaptor: maps PDUs to sockets of TcpIp; the sole upper layer of TcpIp; UdpNm sends its NM PDUs through it (SoAd_IfTransmit).', l: [2, 24] },
    { t: 'Sd', also: ['Service Discovery'], m: 'Service Discovery module: offers and finds SOME/IP services once the Ethernet network is up (see the SOME/IP course).', l: [24] },

    // Part 5. EcuM and BswM
    { t: 'EcuM Flex', also: ['EcuM flexible', 'flexible ECU state manager'], m: 'The EcuM of AUTOSAR 4.x and later (the only one from 4.4.0 on): EcuM handles startup, sleep and shutdown sequences and the wakeup sources, while BswM decides when they happen.', l: [25, 52] },
    { t: 'STARTUP phase', m: 'EcuM phase from reset until the OS and the BSW are running and BswM has taken over.', l: [25] },
    { t: 'UP phase', m: 'EcuM phase in which the ECU runs; BswM decides when to shut down or sleep, and EcuM handles wakeup sources.', l: [25] },
    { t: 'SHUTDOWN phase', m: 'EcuM phase that brings the ECU to its shutdown target (OFF or RESET), or prepares sleep.', l: [25] },
    { t: 'SLEEP phase', m: 'EcuM phase in which the ECU waits in a sleep mode for a wakeup, either halted or polling.', l: [25] },
    { t: 'OFF phase', m: 'EcuM phase in which the ECU is powered off.', l: [25] },
    { t: 'EcuM_Init', m: 'The first EcuM function called after reset: initializes the drivers of the init lists and starts the OS.', l: [26] },
    { t: 'EcuM_StartupTwo', m: 'EcuM function run as the first action of an automatically started OS task: starts SchM, initializes BswM and SchM and starts the scheduler timing.', l: [26] },
    { t: 'driver init list', also: ['init list'], m: 'The configured list of drivers that EcuM initializes, in order, during startup (lists zero and one) or after a wakeup.', l: [26] },
    { t: 'mode request', m: 'An input to BswM that asks for a mode, typically from an SWC (through the RTE) or another requester such as Dcm; BswM treats mode requests and mode indications alike.', l: [27] },
    { t: 'mode arbitration', also: ['rule'], m: 'The part of BswM that evaluates configured rules (logical expressions over mode requests and indications).', l: [27] },
    { t: 'action list', also: ['mode control'], m: 'The list of actions BswM runs when a rule is true or false, for example ComM_CommunicationAllowed or EcuM_GoDownHaltPoll.', l: [27] },
    { t: 'RUN request', also: ['EcuM_RequestRUN'], m: 'A request from an EcuM user that the ECU stays in RUN (EcuM_RequestRUN); EcuM reports the result to BswM, which decides. In EcuM Flex it does not by itself prevent a shutdown.', l: [28] },
    { t: 'POST_RUN request', also: ['EcuM_RequestPOST_RUN'], m: 'A request from an EcuM user for time after the last RUN request is gone, to finish work before shutdown.', l: [28] },
    { t: 'EcuM user', m: 'A configured identifier (EcuM_UserType) for an SWC or another entity that uses the EcuM interfaces: it places RUN and POST_RUN requests, may own one alarm clock, and, if allowed by configuration, may call EcuM_GoDownHaltPoll for RESET or OFF.', l: [28] },
    { t: 'shutdown target', m: 'Where the ECU goes when it shuts down: OFF, RESET (with a reset mode) or SLEEP (with a sleep mode), selected with EcuM_SelectShutdownTarget.', l: [29] },
    { t: 'EcuM_GoDownHaltPoll', m: 'EcuM API (called by BswM) that carries out the selected shutdown target: shutdown or reset, halt or poll.', l: [29] },
    { t: 'sleep mode', m: 'A configured low-power mode of the ECU, with the wakeup sources that may end it and whether the core halts or polls.', l: [30] },
    { t: 'HALT', m: 'Sleep in which the microcontroller core stops until a wakeup interrupt.', l: [30] },
    { t: 'POLL', m: 'Sleep in which the CPU keeps running (typically at a reduced clock) and EcuM loops over EcuM_SleepActivity and the wakeup sources that need polling.', l: [30] },
    { t: 'alarm clock', m: 'Optional EcuM service: users set wakeup alarms on the EcuM clock (seconds since battery connect); the earliest one is the master alarm, which wakes the ECU from sleep when reached.', l: [31] },
    { t: 'master core', m: 'In a multi-core ECU, the core whose EcuM the bootloader starts first (EcuM_Init); it starts the other cores and at shutdown calls ShutdownAllCores.', l: [32] },
    { t: 'slave core', m: 'In a multi-core ECU, a core that the master core starts; its own EcuM part synchronizes startup and shutdown with the master.', l: [32] },
    { t: 'boot target', also: ['EcuM_SelectBootTarget'], m: 'Where the ECU goes after the next reset: the application, the OEM bootloader or the system supplier bootloader.', l: [32] },

    // Part 6. Wakeup
    { t: 'wakeup source', m: 'A configured source of wakeups known to EcuM (a CAN channel, a pin, a timer), one bit of EcuM_WakeupSourceType.', l: [33] },
    { t: 'wakeup event', m: 'The report that a wakeup source has woken up, made by a driver or interface with EcuM_SetWakeupEvent.', l: [33] },
    { t: 'EcuM_SetWakeupEvent', m: 'Called by a driver or interface to tell EcuM that a wakeup source has woken the ECU; the wakeup becomes pending.', l: [33] },
    { t: 'wakeup validation', also: ['validation'], m: 'Checking that a wakeup was real (for example that a valid CAN message follows) before the ECU acts on it.', l: [34] },
    { t: 'EcuM_ValidateWakeupEvent', m: 'Called by the module that validates a wakeup; EcuM marks the source validated and informs BswM and ComM.', l: [34] },
    { t: 'EcuM_CheckValidation', m: 'Integrator callout that EcuM calls during validation; it asks the modules (such as CanIf_CheckValidation) whether the wakeup is confirmed.', l: [34] },
    { t: 'CanIf_CheckValidation', m: 'CanIf API called from the callout EcuM_CheckValidation: if CanIf has stored a valid CanIf_RxIndication (only NM PDUs if validation by NM is configured) since the controller was started, it calls EcuM_ValidateWakeupEvent.', l: [35] },
    { t: 'validation timeout', m: 'How long EcuM waits for a pending wakeup to be validated before it reports it expired.', l: [34] },
    { t: 'pending', m: 'Wakeup state: reported, but not yet validated.', l: [33] },
    { t: 'validated', m: 'Wakeup state: the wakeup was confirmed.', l: [33] },
    { t: 'expired', m: 'Wakeup state: the wakeup was not validated in time.', l: [33] },
    { t: 'ComM_EcuM_WakeUpIndication', m: 'Called by EcuM when a wakeup on a channel is validated; ComM starts the channel and NM with a passive startup.', l: [34] },
    { t: 'CanSM_StartWakeupSource', m: 'CanSM API called from EcuM_StartWakeupSources: the network enters CANSM_BSM_WUVALIDATION, the transceiver goes to normal and the CAN controllers are stopped and started, so that a received frame can validate the wakeup; the PDU mode is then receive only.', l: [34, 35] },
    { t: 'active wakeup', m: 'A wakeup started by this ECU itself (a local request for communication); NM sends NM PDUs and may set the Active Wakeup Bit.', l: [36] },
    { t: 'passive wakeup', m: 'A wakeup by another ECU through the bus; this ECU joins the network without requesting it.', l: [36] },

    // Part 7. NM coordinator
    { t: 'coordinated channel', m: 'A channel that the NM coordinator includes in its coordination; it is kept awake and shut down together with the others of its cluster.', l: [37] },
    { t: 'coordinated shutdown', m: 'Started by the NM coordinator when every bus of a coordination cluster is ready to sleep or already asleep: it releases the awake buses one by one, each after its shutdown timer, so that they reach Bus-Sleep Mode at the same time.', l: [38] },
    { t: 'shutdown timer', also: ['shutdown delay'], m: 'One timer per awake, actively coordinated bus, started when the coordinated shutdown starts: global coordinator time minus the bus\'s TSHUTDOWN_CHANNEL. When it expires NmIf releases that bus, so that all buses reach Bus-Sleep Mode together.', l: [38] },
    { t: 'NM Coordinator Sleep Ready Bit', also: ['sleep ready bit'], m: 'CBV bit (bit 3): set to 1 by an NM coordinator on its actively coordinated channels when its coordinated shutdown starts (top coordinator) or when it receives the bit on its passively coordinated channel (lower coordinator); lower coordinators then start their coordinated shutdown. Set back to 0 when the shutdown is aborted.', l: [39] },
    { t: 'nested sub-bus', m: 'A network connected through a second gateway; NM coordinators in a chain coordinate it with the Sleep Ready bit.', l: [39] },

    // Part 8. Partial networking
    { t: 'PNC state machine', m: 'The ComM state machine of one PNC (one per PNC, independent of the number of channels): main states COMM_PNC_NO_COMMUNICATION and COMM_PNC_FULL_COMMUNICATION, the latter with the sub-states COMM_PNC_REQUESTED, COMM_PNC_READY_SLEEP and COMM_PNC_PREPARE_SLEEP.', l: [41] },
    { t: 'COMM_PNC_REQUESTED', m: 'PNC state: a local ComM user (or a request from another ECU on a gateway) needs the PNC.', l: [41] },
    { t: 'COMM_PNC_READY_SLEEP', m: 'PNC sub-state: no local ComM user requests the PNC, but its EIRA bit is still 1 (other ECUs request it, or this ECU\'s own request has not yet timed out).', l: [41] },
    { t: 'COMM_PNC_PREPARE_SLEEP', m: 'PNC sub-state: the EIRA bit is 0; the PNC prepare sleep timer runs, then the PNC goes to COMM_PNC_NO_COMMUNICATION. Also entered from no communication on a PNC wakeup indication.', l: [41] },
    { t: 'COMM_PNC_NO_COMMUNICATION', m: 'PNC state: the PNC is off.', l: [41] },
    { t: 'EIRA', also: ['External Internal Request Array'], m: 'External and internal requests aggregated: one bit per PNC, set when any ECU on any channel (or this ECU) requests the PNC.', l: [42] },
    { t: 'ERA', also: ['External Request Array'], m: 'External requests per channel: one bit per PNC, set when another ECU on that channel requests it; used by gateways.', l: [42] },
    { t: 'PNC filter mask', also: ['filter mask'], m: 'Per NM channel, one mask byte per PNC bit vector byte: only PNC bits set in the mask count as relevant requests, received or sent; an NM PDU without a relevant request does not keep the ECU awake once PN availability is confirmed.', l: [42] },
    { t: 'PNC reset timer', also: ['reset timer'], m: 'Restarted with every relevant request of a PNC; when it runs out without a new request, the bit goes back to 0 (PNC released). One timer per PNC for the EIRA, one per PNC and channel for the ERA.', l: [42] },
    { t: 'selective wakeup', m: 'A transceiver feature: it wakes the ECU only on a wakeup frame that requests one of its PNCs, not on every bus activity.', l: [43] },
    { t: 'wakeup frame', also: ['WUF'], m: 'The CAN frame (usually an NM PDU) with PNC bits that a transceiver with selective wakeup compares with its configured pattern.', l: [43] },
    { t: 'PNC gateway', m: 'An ECU that forwards PNC requests between channels; its type per channel is active or passive.', l: [44] },
    { t: 'active PNC gateway', also: ['ACTIVE'], m: 'Gateway type of a channel (COMM_GATEWAY_TYPE_ACTIVE): the gateway coordinates the PNC there and sends the combined requests back, including those received on that channel.', l: [44] },
    { t: 'passive PNC gateway', also: ['PASSIVE gateway'], m: 'Gateway type of a channel (COMM_GATEWAY_TYPE_PASSIVE): a superior coordinator coordinates it; the gateway reports its own and its active channels\' requests up but never mirrors back what it received there.', l: [44] },
    { t: 'synchronized PNC shutdown', m: 'The top-level PNC coordinator announces the release of a PNC with a PN shutdown message (PN Shutdown Request Bit set) that intermediate coordinators pass on at once, so all ECUs restart their reset timers together and leave the PNC at nearly the same time.', l: [45] },
    { t: 'PN Shutdown Request Bit', m: 'PNSR: bit 1 of the Control Bit Vector; 1 marks a PN shutdown message.', l: [45, 57] },
    { t: 'PN learning', also: ['PNC learning'], m: 'A PNC learning phase, started with the Repeat Message Request and the Partial Network Learning Bit: every ECU on the channel sends its PNC membership, and a PNC gateway updates its PNC-to-channel mapping from the received bits.', l: [46] },
    { t: 'dynamic PNC-to-channel mapping', m: 'Optional ComM feature of a PNC gateway: the statically configured PNC-to-channel mapping is extended at run time from a PN learning phase (partly draft in R25-11).', l: [46] },
    { t: 'Partial Network Information Bit', also: ['PNI bit', 'PNI'], m: 'CBV bit: set when the NM PDU carries a PNC bit vector.', l: [40, 57] },
    { t: 'Active Wakeup Bit', m: 'CBV bit: set when the node entered Network Mode from Bus-Sleep or Prepare Bus-Sleep Mode because of its own network request; cleared when it leaves Network Mode.', l: [15, 57] },
    { t: 'Partial Network Learning Bit', m: 'Bit 5 of the Control Bit Vector: together with the Repeat Message Request it starts the PNC learning phase; cleared when the sender leaves Repeat Message State.', l: [46, 57] },

    // Part 10. The older way
    { t: 'EcuM Fixed', also: ['EcuMFixed', 'fixed ECU state manager'], m: 'The older EcuM variant with its own fixed state machine (STARTUP, RUN with APP_RUN and APP_POST_RUN, SHUTDOWN, SLEEP, WAKEUP, OFF) that decides shutdown itself from the RUN and POST_RUN requests and the ComM channel states; specified up to 4.3.1 (obsolete there), removed in 4.4.0.', l: [51, 52] },
    { t: 'ComM_CommunicationAllowed', m: 'ComM API that sets communication allowed for a channel; called by BswM (with EcuM Fixed, by EcuM on entering and leaving RUN).', l: [9, 51] },
    { t: 'ComMPncComSignal', m: 'Older ComM configuration (up to R21-11, obsolete there, removed in R22-11): a COM signal through which ComM reads EIRA or ERA, or sends its PNC requests', l: [53, 54] },

    // Added from the lesson build (tools/side/*.json)
    { t: 'LSduR', also: ['L-SDU Router', 'Linklayer SDU Router'], m: 'L-SDU Router (Linklayer SDU Router): hands PDUs between the upper modules (PduR, CanNm, CanTp) and CanIf; new in the R24-11/R25-11 CAN stack.', l: [2] },
    { t: 'Eth driver', also: ['Ethernet Driver'], m: 'Ethernet Driver (module Eth): controls the Ethernet controller in the microcontroller and sends and receives frames.', l: [2] },
    { t: 'IRA', also: ['internal request array'], m: 'Internal request array: one bit per PNC that this ECU requests itself; ComM passes it per channel to NmIf with Nm_UpdateIRA.', l: [4, 41, 42] },
    { t: 'mode switch port', m: 'A port through which a module tells an SWC its current mode (ComM: UM_{user} with interface ComM_CurrentMode); the RTE can start runnables on a mode change.', l: [5] },
    { t: 'PDU mode', also: ['CANIF_ONLINE', 'CANIF_TX_OFFLINE'], m: 'The mode in which CanIf passes the PDUs of one CAN controller: CANIF_ONLINE (send and receive), CANIF_TX_OFFLINE (receive only), CANIF_OFFLINE (neither). CanSM sets it with CanIf_SetPduMode; CanIf also changes it itself: OFFLINE when a controller goes to sleep, TX_OFFLINE when it is stopped.', l: [21] },
    { t: 'CanSM_RequestComMode', m: 'The CanSM API with which ComM requests a communication mode (no, silent or full communication) for one CAN network.', l: [21] },
    { t: 'ComM_CanSM_ModeIndication', also: ['ComM_BusSM_ModeIndication', 'ComM_<Bus>SM_ModeIndication'], m: 'Callback of ComM (ComM_<Bus>SM_ModeIndication for CAN) with which CanSM reports the reached communication mode.', l: [21, 58] },
    { t: 'CANSM_BSM_S_NOCOM', m: 'CanSM state of a CAN network without communication: controllers asleep or stopped, transceiver in standby.', l: [21] },
    { t: 'CANSM_BSM_S_PRE_FULLCOM', m: 'CanSM pre-state on the way to full communication: transceiver to normal, controllers stopped, then started.', l: [21] },
    { t: 'CANSM_BSM_S_FULLCOM', m: 'CanSM state of full communication: controllers started, PDU mode CANIF_ONLINE.', l: [21, 22] },
    { t: 'CANSM_BSM_S_SILENTCOM', m: 'CanSM state of silent communication: controllers started, PDU mode CANIF_TX_OFFLINE (receive only).', l: [21] },
    { t: 'CANSM_BSM_S_PRE_NOCOM', m: 'CanSM pre-state on the way to no communication: controllers stopped and put to sleep, transceiver to standby (with partial networking also the wakeup flag handling).', l: [21] },
    { t: 'default session', also: ['default diagnostic session'], m: 'The diagnostic session an ECU is in when no tester has changed it; in it, Dcm counts diagnostics as active only while it processes a request.', l: [10] },
    { t: 'Dcm_ComM_FullComModeEntered', m: 'ComM tells Dcm that a channel is in full communication; Dcm switches reception and transmission on.', l: [10] },
    { t: 'Dcm_ComM_SilentComModeEntered', m: 'ComM tells Dcm that a channel is in silent communication; Dcm switches all transmission off.', l: [10] },
    { t: 'Dcm_ComM_NoComModeEntered', m: 'ComM tells Dcm that a channel is in no communication; Dcm switches reception and transmission off.', l: [10] },
    { t: 'COMM_E_MODE_LIMITATION', m: 'Return value of ComM_RequestComMode: the mode cannot be granted because of mode inhibition.', l: [11] },
    { t: 'NM cluster', also: ['network management cluster', 'NM-cluster'], m: 'The ECUs on one bus that take part in network management together and go to sleep together.', l: [12] },
    { t: 'Nm_RepeatMessageRequest', m: 'NmIf API that sets the Repeat Message Request for the next NM PDUs of a channel; meant for extensions of the NM stack, not used by ComM.', l: [16] },
    { t: 'Remote Sleep Indication Time', m: 'NM timer: how long a node in Normal Operation State must receive no NM PDU before it reports the Remote Sleep Indication.', l: [18] },
    { t: 'Remote Sleep Cancellation', m: 'Notification (Nm_RemoteSleepCancellation) that, after a Remote Sleep Indication, at least one other node is not ready to sleep any more.', l: [18] },
    { t: 'Nm_RemoteSleepIndication', also: ['Nm_RemoteSleepCancellation'], m: 'NmIf callbacks from CanNm/UdpNm for the Remote Sleep Indication and its cancellation; used only inside NmIf by the NM coordinator, not forwarded to ComM.', l: [18] },
    { t: 'Nm_CarWakeUpIndication', m: 'NmIf callback for a received car wakeup bit; NmIf calls the configured car wakeup callout or, if none, BswM_Nm_CarWakeUpIndication.', l: [18] },
    { t: 'Nm_StateChangeNotification', m: 'NmIf callback with the previous and the new NM state of a channel; NmIf passes it to BswM and can write it into a COM signal.', l: [18] },
    { t: 'PduR_CanNmTriggerTransmit', also: ['PduR_UdpNmTriggerTransmit'], m: 'PduR API with which CanNm (UdpNm) fetches the COM user data I-PDU before it sends an NM PDU.', l: [18] },
    { t: 'Nm_NetworkStartIndication', m: 'NmIf callback: an NM PDU was received in Bus-Sleep Mode; forwarded to ComM as ComM_Nm_NetworkStartIndication.', l: [19] },
    { t: 'Nm_NetworkMode', m: 'NmIf callback: the bus NM has entered Network Mode; forwarded to ComM as ComM_Nm_NetworkMode.', l: [19] },
    { t: 'Nm_PrepareBusSleepMode', m: 'NmIf callback: the bus NM has entered Prepare Bus-Sleep Mode; forwarded to ComM as ComM_Nm_PrepareBusSleepMode.', l: [19] },
    { t: 'Nm_BusSleepMode', m: 'NmIf callback: the bus NM has entered Bus-Sleep Mode; forwarded to ComM as ComM_Nm_BusSleepMode.', l: [19] },
    { t: 'ComM_Nm_BusSleepMode', also: ['ComM_Nm_NetworkMode', 'ComM_Nm_PrepareBusSleepMode'], m: 'ComM callbacks that NmIf calls when it forwards Nm_BusSleepMode, Nm_NetworkMode and Nm_PrepareBusSleepMode.', l: [19] },
    { t: 'Nm_DisableCommunication', also: ['Nm_EnableCommunication'], m: 'NmIf APIs that disable and enable the sending of NM PDUs on a channel (communication control); called by BswM, forwarded to CanNm or UdpNm.', l: [17, 19] },
    { t: 'NM packet', m: 'UdpNm: an Ethernet frame with IP and UDP header whose payload is one NM PDU.', l: [20] },
    { t: 'SoAd_IfTransmit', m: 'SoAd API with which UdpNm (and other modules) hand a PDU to SoAd for transmission over a socket connection.', l: [20] },
    { t: 'UdpNm_SoAdIfRxIndication', m: 'Callback with which SoAd hands a received NM PDU to UdpNm.', l: [20] },
    { t: 'ETHSM_STATE_OFFLINE', m: 'EthSM sub-state (main state no communication): controller down, TcpIp offline.', l: [23] },
    { t: 'ETHSM_STATE_WAIT_TRCVLINK', m: 'EthSM sub-state (no communication): controller active, waiting for the transceiver link state ACTIVE.', l: [23] },
    { t: 'ETHSM_STATE_WAIT_ONLINE', m: 'EthSM sub-state (no communication): link active, EthSM has requested TCPIP_STATE_ONLINE and waits for TcpIp.', l: [23, 24] },
    { t: 'ETHSM_STATE_ONLINE', m: 'EthSM sub-state (full communication): IP communication is available; ComM gets COMM_FULL_COMMUNICATION.', l: [23, 24] },
    { t: 'ETHSM_STATE_ONHOLD', m: 'EthSM sub-state (full communication): the link was lost while online; TcpIp is put on hold, ComM is not told.', l: [23] },
    { t: 'ETHSM_STATE_WAIT_OFFLINE', m: 'EthSM sub-state (full communication): silent or no communication requested; transmission may be off, EthSM waits for TcpIp offline.', l: [23] },
    { t: 'EthIf_CheckWakeup', m: 'EthIf function, called from the EcuM wakeup check (integration code), that checks the Ethernet transceivers or switches for a wakeup and reports it to EcuM.', l: [23] },
    { t: 'COMM_FULL_COMMUNICATION_WITH_WAKEUP_REQUEST', m: 'ComM mode request for an Ethernet channel: full communication, and the Ethernet hardware sends a wakeup on the network (OA TC10, wakeup on the data line).', l: [23] },
    { t: 'StartPreOS Sequence', also: ['StartPreOS'], m: 'The part of startup that EcuM_Init runs before the OS: init list zero, post-build configuration, init list one, reset reason, default shutdown target, StartOS.', l: [26] },
    { t: 'StartPostOS Sequence', also: ['StartPostOS'], m: 'The part of startup that EcuM_StartupTwo runs after the OS has started: SchM start, BswM init, SchM init, scheduler timing.', l: [26] },
    { t: 'post-build configuration', m: 'Configuration data of EcuM and the BSW modules chosen at startup (EcuM_DeterminePbConfiguration) rather than compiled in.', l: [26] },
    { t: 'SchM', also: ['BSW Scheduler'], m: 'BSW Scheduler: calls the main functions of the BSW modules and provides their critical sections; started in EcuM_StartupTwo.', l: [26] },
    { t: 'mode indication', m: 'An input to BswM from a BSW module reporting its current state, for example the ComM mode of a channel or the state of CanSM.', l: [27] },
    { t: 'EcuM_SelectShutdownTarget', m: 'EcuM function that selects where the next shutdown leads (OFF, RESET with a reset mode, SLEEP with a sleep mode); usually called by BswM.', l: [27, 29] },
    { t: 'EcuM_ReleaseRUN', m: 'Releases the RUN request of an EcuM user; when the last one is gone EcuM reports ECUM_RUNSTATUS_RELEASED for RUN to BswM.', l: [28] },
    { t: 'EcuM_ReleasePOST_RUN', m: 'Releases the POST_RUN request of an EcuM user; when the last one is gone EcuM reports ECUM_RUNSTATUS_RELEASED for POST_RUN to BswM.', l: [28] },
    { t: 'ECU Mode Handling', m: 'The optional cooperation of EcuM and BswM about the ECU modes (STARTUP, RUN, POST_RUN, SLEEP, SHUTDOWN): EcuM reports the RUN and POST_RUN requests, BswM sets the state with EcuM_SetState.', l: [28] },
    { t: 'BswM_EcuM_RequestedState', m: 'EcuM tells BswM the result of the RUN request protocol: the state (ECUM_STATE_RUN or ECUM_STATE_POST_RUN) and whether it is requested or released.', l: [28] },
    { t: 'EcuM_SetState', m: 'Called by BswM to set the EcuM state; EcuM then switches the ECU mode in the RTE.', l: [28] },
    { t: 'BswM_EcuM_CurrentState', m: 'EcuM tells BswM its current state, after the RTE has acknowledged the mode switch.', l: [28] },
    { t: 'EcuM_GetLastShutdownTarget', m: 'Returns the shutdown target (and mode) of the previous shutdown, that is, where the ECU came from.', l: [29] },
    { t: 'reset mode', m: 'One configured way to reset the ECU, a variant of the shutdown target RESET: at least ECUM_RESET_MCU, ECUM_RESET_WDG and ECUM_RESET_IO.', l: [29] },
    { t: 'shutdown cause', also: ['EcuM_SelectShutdownCause'], m: 'The recorded reason for a shutdown (ECUM_CAUSE_ECU_STATE, ECUM_CAUSE_WDGM, ECUM_CAUSE_DCM or configured ones), set with EcuM_SelectShutdownCause.', l: [29] },
    { t: 'OffPreOS sequence', also: ['OffPreOS'], m: 'Shutdown steps while the OS still runs: EcuM_OnGoOffOne, de-init of BswM and SchM, check for wakeup events (then RESET), ShutdownOS.', l: [29] },
    { t: 'OffPostOS sequence', also: ['OffPostOS'], m: 'The last shutdown steps after the OS has stopped, started by EcuM_Shutdown: EcuM_OnGoOffTwo, then EcuM_AL_Reset or EcuM_AL_SwitchOff.', l: [29] },
    { t: 'EcuM_GoDown', also: ['EcuM_GoHalt', 'EcuM_GoPoll'], m: 'Up to 4.3.1: EcuM_GoDown (off or reset), EcuM_GoHalt and EcuM_GoPoll (sleep); replaced by EcuM_GoDownHaltPoll in 4.4.0.', l: [29] },
    { t: 'GoSleep sequence', also: ['GoSleep'], m: 'EcuM prepares the sleep: wakeup states to none, EcuM_EnableWakeupSources, and its OS resource to lock the scheduler of the core.', l: [30] },
    { t: 'EcuM_EnableWakeupSources', m: 'Callout in GoSleep that arms each wakeup source of the selected sleep mode.', l: [30] },
    { t: 'EcuM_SleepActivity', m: 'Callout that EcuM calls on each pass of the poll loop in a POLL sleep mode.', l: [30, 31] },
    { t: 'WakeupRestart sequence', also: ['WakeupRestart'], m: 'The steps from sleep back to normal operation: normal MCU mode, EcuM_DisableWakeupSources for the pending sources, EcuM_AL_DriverRestart, scheduler unlocked.', l: [30] },
    { t: 'EcuM clock', m: 'Time in seconds since battery connect, kept by the alarm clock service; it counts in the UP and SLEEP phases.', l: [31] },
    { t: 'master alarm clock', also: ['master alarm'], m: 'The wakeup time EcuM acts on during sleep: always the earliest of all user alarm clocks.', l: [31] },
    { t: 'EcuM_SetRelWakeupAlarm', m: 'Sets the user\'s wakeup alarm a number of seconds from now.', l: [31] },
    { t: 'EcuM_SetAbsWakeupAlarm', m: 'Sets the user\'s wakeup alarm to an absolute time of the EcuM clock; ECUM_E_PAST if that time has passed.', l: [31] },
    { t: 'EcuM_AbortWakeupAlarm', m: 'Cancels the user\'s wakeup alarm; the master alarm moves to the next earliest user alarm.', l: [31] },
    { t: 'NM coordination cluster', also: ['coordination cluster'], m: 'A set of buses that the NM coordinator keeps awake together and shuts down together; each bus belongs to at most one cluster, and an ECU may have several clusters.', l: [37] },
    { t: 'TSHUTDOWN_CHANNEL', also: ['channel shutdown time'], m: 'The time a bus needs from its release until bus sleep; for CanNm and UdpNm the time in Ready Sleep State plus the time in Prepare Bus-Sleep Mode.', l: [38] },
    { t: 'global coordinator time', also: ['NmGlobalCoordinatorTime'], m: 'The total time the coordinated shutdown may take, from its start until all buses sleep; each shutdown timer is this time minus the bus\'s TSHUTDOWN_CHANNEL. It must be at least the longest shutdown time, nested buses included.', l: [38] },
    { t: 'actively coordinated channel', also: ['NmActiveCoordinator'], m: 'A channel on which this NM coordinator leads: it keeps the bus awake, sets the Sleep Ready bit there and shuts the bus down with its own timers.', l: [39] },
    { t: 'passively coordinated channel', m: 'A channel towards a higher NM coordinator: this coordinator sends NM PDUs there only while it or its active buses still need them, and starts its coordinated shutdown when the Sleep Ready bit arrives.', l: [39] },
    { t: 'synchronizing network', also: ['NmSynchronizingNetwork'], m: 'A bus whose NM calls Nm_SynchronizationPoint at suitable moments; the coordinated shutdown of its cluster waits for such a point. Typically a cyclic bus such as FlexRay; CanNm does not provide synchronization points.', l: [39] },
    { t: 'PNC ID', also: ['ComMPncId'], m: 'The number of a PNC, 8 to 511 (R25-11); ID div 8 minus the PNC bit vector offset gives its byte in the PNC bit vector, ID mod 8 its bit.', l: [40] },
    { t: 'COMM_PNC_FULL_COMMUNICATION', m: 'Main PNC state: the PNC is active; sub-states COMM_PNC_REQUESTED, COMM_PNC_READY_SLEEP and COMM_PNC_PREPARE_SLEEP. While a PNC is in it, its channels stay in COMM_FULL_COMMUNICATION.', l: [41] },
    { t: 'PNC prepare sleep timer', also: ['prepare sleep timer', 'ComMPncPrepareSleepTimer'], m: 'ComM timer started on entry to COMM_PNC_PREPARE_SLEEP; when it expires the PNC goes to COMM_PNC_NO_COMMUNICATION.', l: [41] },
    { t: 'Nm_UpdateIRA', m: 'NmIf API called by ComM to pass the IRA (internal PNC requests) of one channel.', l: [41] },
    { t: 'ComM_Nm_UpdateEIRA', m: 'ComM callback called by NmIf when a bit of the EIRA changes.', l: [41, 42] },
    { t: 'ComM_Nm_UpdateERA', m: 'ComM callback called by NmIf when a bit of the ERA of one channel changes (PNC gateway).', l: [41, 42] },
    { t: 'ComM_EcuM_PNCWakeUpIndication', m: 'Called by EcuM when a wakeup source that names PNCs is validated, once per named PNC; ComM starts those PNCs and their channels.', l: [34, 41] },

    // Added from the lesson build (tools/side/*.json)
    { t: 'EcuM_WakeupSourceType', m: 'The EcuM type for wakeup sources: a 32-bit bit field with one bit per wakeup source; bits 0-4 are predefined (power, reset, internal reset, internal and external watchdog), bits 5-31 are assigned to configured sources by the configuration tool.', l: [33] },
    { t: 'EcuM_WakeupStatusType', also: ['ECUM_WKSTATUS_NONE', 'ECUM_WKSTATUS_PENDING', 'ECUM_WKSTATUS_VALIDATED', 'ECUM_WKSTATUS_EXPIRED'], m: 'The state of a wakeup source as EcuM reports it to BswM: ECUM_WKSTATUS_NONE, ECUM_WKSTATUS_PENDING, ECUM_WKSTATUS_VALIDATED or ECUM_WKSTATUS_EXPIRED.', l: [33] },
    { t: 'EcuM_ClearWakeupEvent', m: 'EcuM function that clears the given wakeup sources from the pending, validated and expired events; the sources are back to none.', l: [33] },
    { t: 'BswM_EcuM_CurrentWakeup', m: 'Mode request from EcuM to BswM: the new state (EcuM_WakeupStatusType) of one or more wakeup sources.', l: [33, 34] },
    { t: 'reset reason', m: 'Why the microcontroller started (power on, hardware reset, watchdog), read from the MCU driver at startup; EcuM maps it to a wakeup source (ECUM_WKSOURCE_RESET if it cannot tell).', l: [33] },
    { t: 'EcuM_StartWakeupSources', m: 'Integrator callout called by EcuM when a source becomes pending: switches the wakeup source on so that it can be validated (for CAN: CanSM_StartWakeupSource).', l: [34] },
    { t: 'EcuM_StopWakeupSources', m: 'Integrator callout called by EcuM after a failed validation: switches the wakeup source off again (for CAN: CanSM_StopWakeupSource).', l: [34] },
    { t: 'EcuM_CheckWakeup', m: 'EcuM function to check wakeup sources, called for example from a wakeup interrupt; it passes the sources to the integrator hook EcuM_CheckWakeupHook (up to R20-11 it was itself the callout).', l: [35] },
    { t: 'CanIf_CheckWakeup', m: 'CanIf API called by integration code: asks the CAN controllers and transceivers configured for a wakeup source (Can_CheckWakeup, CanTrcv_CheckWakeup) whether they woke up.', l: [35] },
    { t: 'CanTrcv_CheckWakeup', m: 'CAN transceiver driver API called by CanIf: checks the hardware for a wakeup and reports it with EcuM_SetWakeupEvent.', l: [35] },
    { t: 'CanIf_RxIndication', m: 'Called by the CAN driver to hand a received frame to CanIf; with wakeup validation CanIf also stores the first valid call on a started controller for CanIf_CheckValidation.', l: [35] },
    { t: 'CanSM_StopWakeupSource', m: 'CanSM API called from EcuM_StopWakeupSources after a failed validation: the network leaves CANSM_BSM_WUVALIDATION through CANSM_BSM_S_PRE_NOCOM.', l: [35] },
    { t: 'CANSM_BSM_WUVALIDATION', m: 'CanSM side state for wakeup validation: transceiver normal, controller stopped and started, PDU mode receive only (CANIF_TX_OFFLINE); left by a request for full communication or by CanSM_StopWakeupSource.', l: [35] },
    { t: 'ComM_Nm_NetworkStartIndication', m: 'Called by NmIf when an NM PDU was received in Bus-Sleep Mode; ComM switches the channel to full communication (if communication is allowed) and starts NM with Nm_PassiveStartUp.', l: [19, 36] },

    // Added from the lesson build (tools/side/*.json)
    { t: 'resource manager', m: 'In EcuM Fixed (4.3.1 and older): a BSW module with one idle state that requests RUN whenever it leaves that state, so it keeps the ECU in RUN while it is not idle; ComM is one (idle state: no communication).', l: [51] },
    { t: 'ComM_GetState', m: 'ComM API up to 4.3.1 that returns the state and sub-state of a channel; EcuM Fixed polls it: COMM_NO_COM_NO_PENDING_REQUEST to leave RUN, COMM_NO_COM_REQUEST_PENDING to return from POST_RUN. Removed in 4.4.0.', l: [51] },
    { t: 'EcuMRunMinimumDuration', m: 'EcuM Fixed parameter (EcuMFixedConfiguration): time in seconds the ECU stays in RUN even when nobody requests RUN, so that SWCs can place their requests.', l: [51] },
    { t: 'EcuMComMCommunicationAllowedList', m: 'EcuM Fixed parameter (EcuMFixedConfiguration): references to the ComM channels for which EcuM calls ComM_CommunicationAllowed on entering and leaving RUN.', l: [51] },
    { t: 'TTII', also: ['time triggered increased inoperation'], m: 'Time triggered increased inoperation, EcuM Fixed only: a configured timer wakeup source wakes the ECU repeatedly; after a configured number (divisor) of such wakeups EcuM selects the successor, deeper sleep mode.', l: [51] },
    { t: 'ComM_COMCbk_<sn>', also: ['ComM_COMCbk'], m: 'ComM callback (up to R21-11, removed in R22-11) that COM calls when an EIRA or ERA signal was updated; ComM reads the signal and runs the PNC state machine in its next main function.', l: [53] },
    { t: 'Com_ReceiveSignal', m: 'COM API that copies the value of a received signal; up to R20-11 ComM used it to read EIRA and ERA.', l: [53] },
    { t: 'Com_SendSignal', m: 'COM API that writes a signal value for transmission; up to R20-11 ComM used it to set its PNC bits in the NM user data.', l: [53] },
    { t: 'configuration container', also: ['container'], m: 'A named group of settings in a module\'s ECU configuration (ECUC); it holds configuration parameters and further containers.', l: [55] },
    { t: 'configuration parameter', m: 'One setting in a configuration container, with a type and range: Boolean, number, enumeration, string, function name or a reference to another container.', l: [55] },
    { t: 'multiplicity', m: 'How many times a configuration container or parameter may exist below its parent: 1, 0..1, 1..*, 0..255 and so on.', l: [55] },
    { t: 'ComMChannel', m: 'ComM configuration container for one channel (1..256 in ComMConfigSet): bus type, channel ID, NM variant (ComMNetworkManagement), users (ComMUserPerChannel), ComMPncEnabled.', l: [55] },
    { t: 'ComMUser', m: 'ComM configuration container for one ComM user (0..65535 in ComMConfigSet), with ComMUserIdentifier.', l: [55] },
    { t: 'ComMPnc', m: 'ComM configuration container for one PNC (0..504 in ComMConfigSet): ComMPncId, ComMChannelPerPnc, ComMUserPerPnc.', l: [55] },
    { t: 'NmChannelConfig', m: 'NmIf configuration container for one NM channel (1..*): ComM channel reference, bus NM type (NmBusType), PN, coordination and PNC bit vector length.', l: [55] },
    { t: 'CanNmChannelConfig', also: ['UdpNmChannelConfig'], m: 'CanNm configuration container for one CAN channel (1..* in CanNmGlobalConfig): timers, node identifier, positions of the system bytes, Rx/Tx PDUs. UdpNmChannelConfig is the UdpNm counterpart.', l: [55] },
    { t: 'CanSMManagerNetwork', m: 'CanSM configuration container for one CAN network (1..* in CanSMConfiguration): ComM channel reference, controllers, transceiver, bus-off recovery parameters.', l: [56] },
    { t: 'EthSMNetwork', m: 'EthSM configuration container for one Ethernet network (1..*): ComM channel reference and EthIf controller reference.', l: [56] },
    { t: 'EcuMCommonConfiguration', m: 'EcuM configuration container for what every EcuM needs: default shutdown target, driver init lists, sleep modes, wakeup sources.', l: [56] },
    { t: 'EcuMFlexConfiguration', m: 'EcuM configuration container (0..1) for EcuM Flex only: users, alarm clocks, BswM init list, reset modes, shutdown causes, allowed users.', l: [56] },
    { t: 'CanIfPublicWakeupCheckValidSupport', m: 'CanIf parameter (CanIfPublicCfg, default false) that switches wakeup validation by received CAN messages on; CanIfPublicWakeupCheckValidByNM restricts it to NM messages.', l: [56] },
    { t: 'system bytes', also: ['Nm System Bytes'], m: 'The bytes of the NM PDU that NM itself uses: the Source Node Identifier and the Control Bit Vector, each in byte 0, byte 1 or off.', l: [57] },
    { t: 'guarding condition', also: ['guard'], m: 'A condition (in square brackets, G_... in CanSM) that must hold for a state machine transition to be taken.', l: [58] },
    { t: 'CANSM_BSM_S_NOT_INITIALIZED', m: 'CanSM state after power on, before CanSM_Init; mode requests of ComM are denied.', l: [58] },
    { t: 'CANSM_BSM_S_SILENTCOM_BOR', m: 'CanSM state for a bus-off during silent communication: the controllers are restarted, transmission stays off, then back to SILENTCOM.', l: [58] },
    { t: 'CANSM_BSM_S_CHANGE_BAUDRATE', m: 'CanSM state that stops the controllers, changes the baud rate (CanIf_SetBaudrate) and starts them again, then returns to the requested mode.', l: [58] },
    { t: 'Nm_PncBitVectorRxIndication', m: 'Callback of NmIf: the bus NM passes the PNC bit vector of a received NM PDU; NmIf applies the PNC filter mask and reports whether a relevant request was in it.', l: [42] },
    { t: 'Nm_PncBitVectorTxIndication', m: 'Callback of NmIf: the bus NM fetches this ECU\'s PNC requests (the IRA, or the PNCs of a PN shutdown message) just before it sends an NM PDU.', l: [42] },
    { t: 'CANTRCV_TRCVMODE_NORMAL', m: 'CAN transceiver mode: full bus communication.', l: [43] },
    { t: 'CANTRCV_TRCVMODE_STANDBY', m: 'CAN transceiver mode: no communication; the ECU stays powered if the transceiver controls the supply; a wakeup by the bus or a local event is possible.', l: [43] },
    { t: 'CANTRCV_TRCVMODE_SLEEP', m: 'CAN transceiver mode: no communication, the ECU may be unpowered; entered only from standby; a wakeup by the bus or a local event is possible.', l: [43] },
    { t: 'wake-up pattern', also: ['WUP'], m: 'Bus activity that wakes a plain CAN transceiver; any CAN traffic produces it. A transceiver with selective wakeup waits for a wakeup frame instead.', l: [43] },
    { t: 'WUF flag', m: 'Flag in a selective wakeup transceiver that records a detected wakeup frame (also in normal mode), so that none is lost on the way to standby; cleared by CanSM before standby.', l: [43] },
    { t: 'POR flag', m: 'Transceiver status flag: power-on reset; CanTrcv writes the selective wakeup configuration again and reports a wakeup to EcuM at initialization.', l: [43] },
    { t: 'SYSERR flag', also: ['SYSERR'], m: 'Transceiver status flag: a hardware error (for example a configuration error) disabled selective wakeup; the transceiver wakes on any wake-up pattern and PN availability is not confirmed.', l: [43] },
    { t: 'CanIf_ConfirmPnAvailability', also: ['CanSM_ConfirmPnAvailability', 'CanNm_ConfirmPnAvailability', 'PN availability'], m: 'Called by CanTrcv when it enters normal mode without SYSERR: partial networking works. Passed on as CanSM_ConfirmPnAvailability and CanNm_ConfirmPnAvailability; CanNm then starts dropping NM PDUs without relevant PNC requests.', l: [43] },
    { t: 'PnTxFilter', m: 'CanIf filter per CAN controller (with partial networking): while it is on, only the configured PN filter PDUs (typically the NM PDU) may be sent; it turns off with the first Tx confirmation or received frame.', l: [43] },
    { t: 'CanSM_TxTimeoutException', m: 'Called by CanNm when an NM PDU on a partial network was not confirmed in time; CanSM stops and restarts the CAN controllers of the network.', l: [43] },
    { t: 'top-level PNC coordinator', m: 'A PNC gateway whose channels of a PNC all have the gateway type ACTIVE; it sees every request of the PNC and starts a synchronized PNC shutdown.', l: [44, 45] },
    { t: 'intermediate PNC coordinator', m: 'A PNC gateway with at least one channel of type PASSIVE towards a superior coordinator; it reports up and passes down, and forwards PN shutdown messages.', l: [44, 45] },
    { t: 'PNC leaf node', m: 'An ECU that is no PNC coordinator: it requests PNCs and handles PN shutdown messages as ordinary NM PDUs.', l: [44, 45] },
    { t: 'managing channel', m: 'A ComM channel (NM variant FULL) that handles the interaction with NmIf for the channels that reference it as managed channels.', l: [44] },
    { t: 'managed channel', m: 'A ComM channel without NM of its own (NM variant LIGHT, no PNC gateway type) that follows exactly one managing channel.', l: [44] },
    { t: 'PN shutdown message', m: 'An NM PDU with the PN Shutdown Request Bit set; its PNC bits name the PNCs that are shut down. Sent by a top-level PNC coordinator, forwarded by intermediate coordinators.', l: [45] },
    { t: 'Nm_RequestSynchronizedPncShutdown', m: 'NmIf API called by ComM (top-level or intermediate coordinator): announce the shutdown of one PNC on one channel with a PN shutdown message.', l: [45] },
    { t: 'Nm_ForwardSynchronizedPncShutdown', m: 'NmIf callback: the bus NM received a PN shutdown message on a channel; NmIf restarts the EIRA timer, clears the ERA bits and informs ComM.', l: [45] },
    { t: 'ComM_Nm_ForwardSynchronizedPncShutdown', m: 'ComM callback (channel, PNC bit vector): NmIf reports a received PN shutdown message; an intermediate coordinator releases the PNCs and passes the shutdown to its active channels.', l: [45] },
    { t: 'CanNm_ActivateTxPnShutdownMsg', also: ['UdpNm_ActivateTxPnShutdownMsg', 'CanNm_DeactivateTxPnShutdownMsg', 'UdpNm_DeactivateTxPnShutdownMsg'], m: 'Called by NmIf: the bus NM sets the PN Shutdown Request Bit and sends PN shutdown messages on the channel (Deactivate: back to ordinary NM PDUs).', l: [45] },
    { t: 'PNC membership', m: 'The PNCs an ECU belongs to; sent as PNC bits during PN learning; set by an SWC with ComM_UpdatePncMembership.', l: [46] },
    { t: 'ComM_PnLearningRequest', m: 'ComM API: starts the PNC learning phase on all channels with dynamic PNC-to-channel mapping (all channels must be in full communication).', l: [46] },
    { t: 'Nm_PnLearningRequest', also: ['CanNm_PnLearningRequest', 'UdpNm_PnLearningRequest'], m: 'NmIf API: passes a learning request for one channel to the bus NM, which sets the Repeat Message Request and the Partial Network Learning Bit and enters Repeat Message State (UdpNm variant still draft in R25-11).', l: [46] },
    { t: 'ComM_Nm_PncLearningBitIndication', m: 'ComM callback: an NM PDU with the Partial Network Learning Bit was received on a channel; the learning phase of the channel becomes active.', l: [46] },
    { t: 'ComM_Nm_RepeatMessageLeftIndication', m: 'ComM callback: the bus NM has left Repeat Message State; the learning phase of the channel ends.', l: [46] },
    { t: 'FrSM', also: ['FlexRay State Manager'], m: 'The bus state manager for FlexRay: maps ComM\'s communication modes to the states of the FlexRay controllers and sends the wakeup pattern.', l: [] },
    { t: 'FrNm', also: ['FlexRay NM'], m: 'Network management on FlexRay: the same coordination algorithm with NM data and a separate NM-Vote; the bus sleeps at the end of a repetition cycle without a positive vote.', l: [] },
    { t: 'LinSM', also: ['LIN State Manager'], m: 'The bus state manager for LIN, with only LINSM_NO_COM and LINSM_FULL_COM per network; LIN has no AUTOSAR NM.', l: [] },
    { t: 'NM-Vote', m: 'FlexRay NM: the information a node sends to vote for keeping the cluster awake.', l: [] },
    { t: 'goto-sleep command', m: 'LIN: the command the master sends to put all nodes of the LIN bus to sleep.', l: [] },

    // Added from the lesson build (tools/side/*.json)
    { t: 'callout', also: ['callouts'], m: 'A function that EcuM (or another module) calls and the integrator fills in, such as EcuM_OnGoOffOne or EcuM_CheckValidation.', l: [29] }
  ];

  const index = new Map();
  TERMS.forEach((e) => [e.t].concat(e.also || []).forEach((k) => index.set(k.toLowerCase(), e)));
  function find(key) {
    const k = String(key).trim().toLowerCase().replace(/\s+/g, ' ');
    return index.get(k) || (k.endsWith('s') ? index.get(k.slice(0, -1)) : undefined);
  }

  window.Glossary = { TERMS, find };

  const marks = document.querySelectorAll('.term');
  if (!marks.length) return;

  const tip = document.createElement('div');
  tip.className = 'term-tip';
  tip.id = 'term-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.appendChild(tip);
  let owner = null;

  function show(el) {
    const e = find(el.dataset.term || el.textContent);
    owner = el;
    tip.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = e.t;
    const p = document.createElement('span');
    p.textContent = ' ' + e.m;
    tip.append(b, p);
    tip.hidden = false;
    el.setAttribute('aria-describedby', 'term-tip');
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth;
    const left = Math.max(8, Math.min(r.left, document.documentElement.clientWidth - w - 8));
    tip.style.left = (left + window.scrollX) + 'px';
    tip.style.top = (r.bottom + window.scrollY + 6) + 'px';
  }
  function hide() {
    if (owner) owner.removeAttribute('aria-describedby');
    owner = null;
    tip.hidden = true;
  }

  marks.forEach((el) => {
    if (!find(el.dataset.term || el.textContent)) {
      console.warn('Glossary: no entry for "' + (el.dataset.term || el.textContent) + '"');
      el.classList.remove('term');
      return;
    }
    el.tabIndex = 0;
    el.addEventListener('mouseenter', () => show(el));
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', () => show(el));
    el.addEventListener('blur', hide);
    el.addEventListener('click', (ev) => { ev.stopPropagation(); if (owner === el) hide(); else show(el); });
  });
  document.addEventListener('click', hide);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hide(); });
  window.addEventListener('resize', hide);
})();
